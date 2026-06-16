"""Student enrollment, notes, and quiz routes."""
import logging
from typing import Dict, List, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.session import get_db
from middleware.auth_middleware import require_student
from models import Lecture, User, enrollments, Quiz
from tasks.quiz_tasks import generate_quiz_task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/students", tags=["students"])


class EnrollRequest(BaseModel):
    lecture_id: str


class QuizSubmitRequest(BaseModel):
    answers: Dict[str, str]  # quiz_id -> selected choice


@router.get("/lectures")
async def get_enrolled_lectures(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Return all lectures the student is enrolled in."""
    stmt = (
        select(Lecture)
        .join(enrollments, Lecture.id == enrollments.c.lecture_id)
        .where(enrollments.c.student_id == current_user.id)
    )
    result = await db.execute(stmt)
    lectures = result.scalars().all()
    
    return [
        {
            "id": str(lec.id),
            "title": lec.title,
            "status": lec.status.value,
            "youtube_url": lec.youtube_url,
        } for lec in lectures
    ]


@router.post("/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_student(
    request: EnrollRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Create an enrollment record."""
    # Coerce to UUID so an invalid id is a clean 400, not a DB cast error.
    try:
        lecture_uuid = UUID(request.lecture_id)
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid lecture id")

    # Verify lecture exists
    res = await db.execute(select(Lecture).where(Lecture.id == lecture_uuid))
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Lecture not found")

    # Insert into association table gracefully (do nothing if exists)
    stmt = insert(enrollments).values(
        student_id=current_user.id,
        lecture_id=lecture_uuid
    ).on_conflict_do_nothing()
    
    await db.execute(stmt)
    await db.commit()
    
    return {"message": "Enrolled successfully", "lecture_id": request.lecture_id}


@router.get("/lectures/{lecture_id}/quiz")
async def get_quiz(
    lecture_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Return all Quiz rows for this lecture. Triggers generation if empty."""
    # Verify enrollment
    enroll_stmt = select(enrollments).where(
        enrollments.c.student_id == current_user.id,
        enrollments.c.lecture_id == lecture_id
    )
    if not (await db.execute(enroll_stmt)).first():
        raise HTTPException(status_code=403, detail="Not enrolled in this lecture.")

    stmt = select(Quiz).where(Quiz.lecture_id == lecture_id)
    result = await db.execute(stmt)
    quizzes = result.scalars().all()

    if not quizzes:
        # Trigger Celery task
        logger.info("No quizzes found for lecture %s. Triggering generation...", lecture_id)
        generate_quiz_task.delay(str(lecture_id))
        return {
            "status": "generating", 
            "message": "Quiz is being prepared"
        }

    return [
        {
            "id": str(q.id),
            "question": q.question,
            "choices": q.choices,
        } for q in quizzes
    ]


@router.post("/lectures/{lecture_id}/quiz/submit")
async def submit_quiz(
    lecture_id: UUID,
    request: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_student),
):
    """Score the submission."""
    # Verify enrollment
    enroll_stmt = select(enrollments).where(
        enrollments.c.student_id == current_user.id,
        enrollments.c.lecture_id == lecture_id
    )
    if not (await db.execute(enroll_stmt)).first():
        raise HTTPException(status_code=403, detail="Not enrolled in this lecture.")

    # Fetch all quizzes for this lecture
    stmt = select(Quiz).where(Quiz.lecture_id == lecture_id)
    result = await db.execute(stmt)
    quizzes = result.scalars().all()

    if not quizzes:
        raise HTTPException(status_code=404, detail="No quizzes found for this lecture.")

    quiz_map = {str(q.id): q for q in quizzes}
    
    score = 0
    total = len(quizzes)
    results = []

    for qid, q in quiz_map.items():
        selected = request.answers.get(qid)
        is_correct = False
        
        # Parse the actual answer letter "A", "B", etc.
        # Often LLMs return "A", sometimes "A. text"
        # The prompt asked for "answer": "A" | "B" | "C" | "D"
        correct_answer = q.answer.strip()
        if selected and selected.strip().upper() == correct_answer.upper():
            is_correct = True
            score += 1
            
        results.append({
            "quiz_id": qid,
            "correct": is_correct,
            "explanation": q.explanation
        })

    return {
        "score": score,
        "total": total,
        "results": results
    }
