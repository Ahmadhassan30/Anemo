import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from db.session import async_session_maker, engine
from models import User, Lecture, LectureStatus, Concept, RenderStatus
from tasks.pipeline_tasks import run_pipeline_task
from sqlalchemy import select

async def main():
    print("Connecting to database...")
    async with async_session_maker() as db:
        print("Finding professor@demo.com...")
        prof_res = await db.execute(select(User).where(User.email == "professor@demo.com"))
        prof = prof_res.scalar_one_or_none()
        if not prof:
            print("Error: professor@demo.com not found. Seed database first.")
            return
        
        print(f"Professor ID: {prof.id}")
        
        # 1. Create the Lecture
        lecture = Lecture(
            professor_id=prof.id,
            title="LectureOS Animation System Test Run",
            raw_video_url="http://api:8080/dummy.mp4",
            status=LectureStatus.pending
        )
        db.add(lecture)
        await db.commit()
        await db.refresh(lecture)
        
        print(f"Created lecture ID: {lecture.id}")
        
        # 2. Add 4 Concept rows of different visual types to test them sequentially
        concepts = [
            Concept(
                lecture_id=lecture.id,
                title="1. Process Flow Diagram",
                ts_start=0.0,
                ts_end=5.0,
                visual_type="diagram_flow",
                render_status=RenderStatus.pending
            ),
            Concept(
                lecture_id=lecture.id,
                title="2. Reduction Equation",
                ts_start=5.0,
                ts_end=10.0,
                visual_type="equation_display",
                render_status=RenderStatus.pending
            ),
            Concept(
                lecture_id=lecture.id,
                title="3. Midpoint Calculation Code",
                ts_start=10.0,
                ts_end=15.0,
                visual_type="code_walkthrough",
                render_status=RenderStatus.pending
            ),
            Concept(
                lecture_id=lecture.id,
                title="4. Search Complexity Graph",
                ts_start=15.0,
                ts_end=20.0,
                visual_type="graph_animation",
                render_status=RenderStatus.pending
            )
        ]
        db.add_all(concepts)
        await db.commit()
        print("Seeded 4 test concepts in the database.")
        
        # Trigger Celery task
        print("Triggering run_pipeline Celery task...")
        run_pipeline_task.delay(str(lecture.id))
        print("Celery task dispatched successfully!")

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(main())
    finally:
        loop.run_until_complete(engine.dispose())
        loop.close()
