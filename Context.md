# Context



# Boys before commiting anything please add the full context of what you have done to codebase, here in this file. In this way we all will remain sync and up-to-date.









## Project

Project name: LectureOS.
Agentic AI platform that converts raw lectures into animated educational videos with professor and student portals.

## Architecture

Next.js 15 frontend with a FastAPI backend and Celery plus Redis workers.
SSE streams pipeline status to the professor dashboard.

## Key Agents

Ingest, Transcription, Segmentation, CodeGen (Planner-Coder-Critic), Render, Composition, RAG Indexing, Publish.
These agents form the end-to-end lecture-to-video pipeline.

## Database

PostgreSQL with pgvector for embeddings.
Tables: users, lectures, concepts, embeddings, quizzes, agent_runs.

## AI Stack

faster-whisper large-v3, DeepSeek-V3 API, Qwen2.5-Coder-32B local, BAAI/bge-small-en-v1.5.
Manim Community Edition for animation rendering.

## Infrastructure

AWS S3, Redis, Celery, YouTube Data API v3, Vercel frontend hosting, Docker.
Nginx is configured to support SSE proxying.

## Directory Structure

apps/ for web and api apps, packages/ for shared types.
infra/ for compose and nginx, scripts/ for eval and demo utilities, docs/ for documentation.

Directory tree:

.
├─ .env.example
├─ .gitignore
├─ Context.md
├─ README.md
├─ propsal.md
├─ turbo.json
├─ package.json
├─ apps/
│  ├─ web/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ lib/
│  │  ├─ store/
│  │  ├─ types/
│  │  ├─ .env.local.example
│  │  ├─ next.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ package.json
│  └─ api/
│     ├─ agents/
│     ├─ db/
│     ├─ middleware/
│     ├─ models/
│     ├─ orchestrator/
│     ├─ routers/
│     ├─ schemas/
│     ├─ services/
│     ├─ tasks/
│     ├─ tests/
│     ├─ utils/
│     ├─ alembic.ini
│     ├─ config.py
│     ├─ Dockerfile
│     ├─ main.py
│     ├─ requirements.txt
│     └─ .env.example
├─ packages/
│  └─ types/
│     ├─ index.ts
│     └─ package.json
├─ infra/
│  ├─ docker-compose.yml
│  ├─ docker-compose.prod.yml
│  ├─ nginx/
│  │  └─ nginx.conf
│  └─ scripts/
│     ├─ setup_dev.sh
│     ├─ run_worker.sh
│     └─ migrate.sh
├─ scripts/
│  ├─ eval/
│  │  ├─ whisper_benchmark.py
│  │  └─ manim_llm_eval.py
│  └─ demo/
│     └─ generate_demo_video.py
└─ docs/
	├─ architecture.md
	├─ agent-pipeline.md
	├─ api-reference.md
	└─ deployment.md

## Last Updated

2026-06-05
