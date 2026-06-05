"""Student enrollment, notes, and quiz routes."""
from fastapi import APIRouter

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/enroll")
async def enroll_student():
    # TODO: enroll a student in a lecture
    pass


@router.get("/lectures/{lecture_id}/notes")
async def get_notes(lecture_id: str):
    # TODO: return lecture notes
    pass


@router.get("/lectures/{lecture_id}/quiz")
async def get_quiz(lecture_id: str):
    # TODO: return quiz questions
    pass
