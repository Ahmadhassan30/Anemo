"""RAG chatbot routes for lecture Q and A."""
from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("")
async def chat():
    # TODO: run RAG retrieval and LLM response
    pass
