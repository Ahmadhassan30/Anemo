"""RAG chatbot routes for lecture Q and A."""

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from middleware.auth_middleware import require_student
from models import Lecture, User, enrollments, ChatMessage
from schemas.chat import ChatRequest, ChatResponse, CitationSchema
from services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Ask a question to the lecture's RAG system."""

    # 0. Coerce the body's lecture_id to a UUID so a malformed value is a clean
    #    400, not an unhandled DB cast error (which the browser would otherwise
    #    surface as a misleading CORS failure).
    try:
        lecture_uuid = UUID(str(request.lecture_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid lecture id")

    # 1. Verify lecture exists
    result = await db.execute(select(Lecture).where(Lecture.id == lecture_uuid))
    lecture = result.scalar_one_or_none()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")

    # 2. Verify student is enrolled in the lecture
    enroll_stmt = select(enrollments).where(
        enrollments.c.student_id == current_user.id,
        enrollments.c.lecture_id == lecture.id
    )
    enroll_res = await db.execute(enroll_stmt)
    if not enroll_res.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not enrolled in this lecture."
        )

    # 3. Call RAG service
    rag_response = await rag_service.answer(request.question, str(lecture_uuid), db)
    
    answer_text = rag_response.get("answer", "")
    raw_citations = rag_response.get("citations", [])

    citations = [
        CitationSchema(
            ts_start=c.get("ts_start", 0.0),
            chunk_text=c.get("chunk_text", ""),
            concept_id=c.get("concept_id"),
            similarity=c.get("similarity")
        ) for c in raw_citations
    ]

    # 4. Save chat history
    user_msg = ChatMessage(
        lecture_id=lecture.id,
        student_id=current_user.id,
        role="user",
        content=request.question
    )
    asst_msg = ChatMessage(
        lecture_id=lecture.id,
        student_id=current_user.id,
        role="assistant",
        content=answer_text
    )
    db.add_all([user_msg, asst_msg])
    await db.commit()

    # 5. Return
    return ChatResponse(
        answer=answer_text,
        citations=citations,
        lecture_id=request.lecture_id,
        question=request.question
    )


@router.get("/{lecture_id}/history")
async def chat_history(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Return the last 20 chat exchanges (40 messages) for this student + lecture."""
    # Verify enrollment
    enroll_stmt = select(enrollments).where(
        enrollments.c.student_id == current_user.id,
        enrollments.c.lecture_id == lecture_id
    )
    enroll_res = await db.execute(enroll_stmt)
    if not enroll_res.first():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You are not enrolled in this lecture."
        )

    # Fetch last 40 messages ordered by descending created_at
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.lecture_id == lecture_id, ChatMessage.student_id == current_user.id)
        .order_by(desc(ChatMessage.created_at))
        .limit(40)
    )
    result = await db.execute(stmt)
    messages_desc = result.scalars().all()
    
    # Reverse to return in chronological order
    messages = reversed(messages_desc)
    
    return [
        {
            "id": str(m.id),
            "role": m.role,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]
