"""Celery tasks for quiz generation."""
import asyncio
import logging

from sqlalchemy import select

from db.session import async_session_maker
from models import Concept, Quiz
from services.llm_service import llm_service
from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.generate_quiz")
def generate_quiz_task(lecture_id: str) -> int:
    """Synchronous Celery entry point for quiz generation."""
    logger.info("Generating quiz for lecture %s", lecture_id)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        return loop.run_until_complete(_generate_quiz_async(lecture_id))
    except Exception:
        logger.exception("Quiz generation failed for lecture %s", lecture_id)
        raise
    finally:
        try:
            from db.session import engine
            loop.run_until_complete(engine.dispose())
        except Exception:
            logger.exception("Failed to dispose database engine")
        loop.close()


async def _generate_quiz_async(lecture_id: str) -> int:
    system_prompt = (
        "Generate 2 multiple-choice questions testing understanding of this concept. "
        "Return a JSON array where each item matches EXACTLY this schema: "
        "{\"question\": str, \"choices\": [\"A. ...\",\"B. ...\",\"C. ...\",\"D. ...\"], "
        "\"answer\": \"A\" | \"B\" | \"C\" | \"D\", \"explanation\": str}"
    )

    total_generated = 0

    async with async_session_maker() as db:
        # 1. Fetch all concepts
        stmt = select(Concept).where(Concept.lecture_id == lecture_id)
        result = await db.execute(stmt)
        concepts = result.scalars().all()

        if not concepts:
            logger.warning("No concepts found for lecture %s", lecture_id)
            return 0

        # 2. For each concept, prompt DeepSeek
        for concept in concepts:
            user_prompt = f"Concept: {concept.title}\n\nSummary:\n{concept.summary or concept.title}"
            
            try:
                # Expecting a JSON array directly
                questions_data = await llm_service.chat_json(
                    system=system_prompt,
                    user=user_prompt
                )
                
                # Sometime models return {"questions": [...]} instead of an array. Handle both.
                if isinstance(questions_data, dict) and "questions" in questions_data:
                    items = questions_data["questions"]
                elif isinstance(questions_data, list):
                    items = questions_data
                else:
                    items = [questions_data]

                # 3. Insert Quiz rows
                for item in items:
                    # Validate schema loosely
                    if not all(k in item for k in ("question", "choices", "answer")):
                        continue

                    quiz_row = Quiz(
                        lecture_id=lecture_id,
                        question=item["question"],
                        choices=item["choices"],
                        answer=item["answer"],
                        explanation=item.get("explanation", "")
                    )
                    db.add(quiz_row)
                    total_generated += 1

            except Exception as e:
                logger.error("Failed to generate questions for concept %s: %s", concept.id, e)

        await db.commit()

    logger.info("Generated %d questions for lecture %s", total_generated, lecture_id)
    return total_generated
