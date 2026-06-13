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
# Context

This file is the living handoff for the repository. It should give another coding agent enough project-specific context to understand the directory layout, runtime architecture, and current implementation surfaces without re-discovering them from scratch.

## Project Identity

- Project name: LectureOS.
- Core idea: an agentic AI platform that converts raw lecture material into animated educational videos.
- Product surfaces: a Professor Portal for uploads, pipeline monitoring, and lecture review, plus a Student Portal for watching videos, taking quizzes, and using a RAG-powered chatbot.
- Monorepo style: Turbo workspace with a Next.js frontend, a FastAPI backend, shared TypeScript types, and deployment / utility assets around them.

## Root-Level Workspace

The repo root currently contains:

- Context.md: this project handoff file.
- README.md: brief top-level project description.
- propsal.md: proposal / planning document.
- package.json: Turbo workspace root scripts.
- turbo.json: Turbo pipeline config.
- apps/: application packages.
- packages/: shared packages.
- infra/: Docker Compose, Nginx, and helper scripts.
- scripts/: demo and evaluation utilities.
- docs/: architecture and operational documentation.

Root scripts from package.json:

- pnpm dev runs turbo dev.
- pnpm build runs turbo build.
- pnpm lint runs turbo lint.
- pnpm test runs turbo test.

Workspace metadata:

- Package manager: pnpm@9.0.0.
- Workspace globs: apps/* and packages/*.
- Root dev dependency: turbo@2.0.0.

## Current System Architecture

The system is split into three major runtime layers:

1. Frontend: Next.js 15 application in apps/web.
2. API and orchestration: FastAPI application in apps/api.
3. Async workers: Celery tasks and supporting services, backed by Redis.

Pipeline progress is streamed to the professor UI over SSE, so the frontend can show live lecture processing state while the backend agents run.

PostgreSQL is the primary relational store, and pgvector is used for embedding-backed retrieval features.

## End-to-End Product Flow

The intended lecture-to-animation flow is:

1. A professor uploads or links lecture content.
2. The backend ingests the lecture and persists metadata.
3. Audio is transcribed.
4. The transcript is segmented into concept-sized chunks.
5. The code generation agent creates animation code and scene logic.
6. Rendering and composition produce the final animated lesson.
7. The resulting content is indexed for retrieval and reused by the chatbot and quiz layers.
8. Publishing makes the video available to students and can optionally push to YouTube-related flows.
9. SSE events keep the professor dashboard updated throughout the pipeline.

## Backend: apps/api

### Entry Point

- apps/api/main.py creates the FastAPI app instance.
- It applies CORS using settings from apps/api/config.py.
- It registers routers for auth, lectures, pipeline, students, chat, and YouTube.
- The current file includes TODO notes for production middleware tuning and router versioning.

### Backend Folder Map

- apps/api/agents/: agent implementations for the pipeline.
- apps/api/db/: database session setup, seeding, and Alembic migration wiring.
- apps/api/middleware/: auth and logging middleware.
- apps/api/models/: SQLAlchemy models.
- apps/api/orchestrator/: pipeline coordination, retry policy, and event definitions.
- apps/api/routers/: API route modules.
- apps/api/schemas/: request and response schemas.
- apps/api/services/: external and domain services.
- apps/api/tasks/: Celery app and async jobs.
- apps/api/tests/: backend tests.
- apps/api/utils/: shared helper functions.

### Agent Modules

The agent layer currently contains:

- apps/api/agents/base.py: shared agent base abstractions.
- apps/api/agents/ingest_agent.py: lecture ingestion.
- apps/api/agents/transcription_agent.py: audio transcription.
- apps/api/agents/segmentation_agent.py: transcript chunking and segment planning.
- apps/api/agents/codegen_agent.py: code generation for animation logic.
- apps/api/agents/render_agent.py: rendering work.
- apps/api/agents/composition_agent.py: assembly and composition of generated assets.
- apps/api/agents/rag_indexing_agent.py: embedding and retrieval indexing.
- apps/api/agents/publish_agent.py: publishing and distribution.

These agent names define the main pipeline vocabulary used across the backend, docs, and UI.

### Orchestration

- apps/api/orchestrator/pipeline.py is the central pipeline coordinator.
- apps/api/orchestrator/events.py defines pipeline event structures used for streaming progress.
- apps/api/orchestrator/retry.py handles retry behavior for transient failures.

### Routers

Router modules currently present:

- apps/api/routers/auth.py
- apps/api/routers/chat.py
- apps/api/routers/lectures.py
- apps/api/routers/pipeline.py
- apps/api/routers/students.py
- apps/api/routers/youtube.py

The docs indicate the API surface covers authentication, lecture CRUD, upload presigning, pipeline trigger and status streaming, and student/chat flows.

### Schemas

- apps/api/schemas/auth.py
- apps/api/schemas/chat.py
- apps/api/schemas/concept.py
- apps/api/schemas/lecture.py
- apps/api/schemas/pipeline.py

### Models

Backend models currently include:

- apps/api/models/base.py
- apps/api/models/user.py
- apps/api/models/lecture.py
- apps/api/models/concept.py
- apps/api/models/embedding.py
- apps/api/models/quiz.py
- apps/api/models/agent_run.py

The existing documentation and migration names indicate PostgreSQL tables for users, lectures, concepts, embeddings, quizzes, and agent runs.

### Services

Service modules currently present:

- apps/api/services/ffmpeg_service.py
- apps/api/services/llm_service.py
- apps/api/services/manim_service.py
- apps/api/services/rag_service.py
- apps/api/services/s3_service.py
- apps/api/services/whisper_service.py
- apps/api/services/youtube_service.py

These correspond to the main external integrations and media-processing primitives used by the pipeline.

### Tasks and Async Jobs

- apps/api/tasks/celery_app.py configures the Celery application.
- apps/api/tasks/pipeline_tasks.py contains pipeline job definitions.
- apps/api/tasks/quiz_tasks.py contains quiz-related async jobs.

### Database

- apps/api/db/session.py manages DB sessions.
- apps/api/db/seed.py seeds initial data.
- apps/api/db/migrations/env.py is the Alembic environment entry.
- apps/api/db/migrations/versions/001_init_schema.py initializes the schema.
- apps/api/db/migrations/versions/002_add_pgvector.py adds pgvector support.

### Middleware

- apps/api/middleware/auth_middleware.py
- apps/api/middleware/logging_middleware.py

### Utilities

- apps/api/utils/audio.py
- apps/api/utils/chunking.py
- apps/api/utils/prompts.py
- apps/api/utils/validators.py

These utilities support media handling, segmentation logic, prompt construction, and validation.

### Tests

Backend tests currently present:

- apps/api/tests/conftest.py
- Agent tests: apps/api/tests/test_agents/
- Router tests: apps/api/tests/test_routers/
- Service tests: apps/api/tests/test_services/

Concrete test files currently visible include:

- apps/api/tests/test_agents/test_codegen.py
- apps/api/tests/test_agents/test_render.py
- apps/api/tests/test_agents/test_segmentation.py
- apps/api/tests/test_agents/test_transcription.py
- apps/api/tests/test_routers/test_auth.py
- apps/api/tests/test_routers/test_chat.py
- apps/api/tests/test_routers/test_lectures.py
- apps/api/tests/test_services/test_rag.py
- apps/api/tests/test_services/test_s3.py

### Backend Packaging and Runtime Files

- apps/api/alembic.ini: Alembic configuration.
- apps/api/config.py: settings and environment-driven configuration.
- apps/api/Dockerfile: container image for the API service.
- apps/api/requirements.txt: Python dependencies.
- apps/api/.env.example: example environment variables.

## Frontend: apps/web

### General Structure

The frontend is a Next.js App Router application with per-role sections for professors and students.

Visible top-level frontend files:

- apps/web/app/: route tree.
- apps/web/components/: reusable UI and page components.
- apps/web/lib/: client helpers.
- apps/web/store/: Zustand stores.
- apps/web/types/: local TypeScript types.
- apps/web/next.config.ts: Next.js config.
- apps/web/tailwind.config.ts: Tailwind config.
- apps/web/tsconfig.json: TypeScript config.
- apps/web/package.json: frontend package scripts and dependencies.

### Route Tree

Known route files and segments:

- apps/web/app/layout.tsx: root layout.
- apps/web/app/page.tsx: root landing page.
- apps/web/app/(auth)/login/page.tsx
- apps/web/app/(auth)/register/page.tsx
- apps/web/app/api/auth/[...nextauth]/route.ts
- apps/web/app/professor/layout.tsx
- apps/web/app/professor/dashboard/page.tsx
- apps/web/app/professor/settings/page.tsx
- apps/web/app/professor/upload/page.tsx
- apps/web/app/professor/lectures/[lectureId]/page.tsx
- apps/web/app/professor/lectures/[lectureId]/review/page.tsx
- apps/web/app/student/layout.tsx
- apps/web/app/student/dashboard/page.tsx
- apps/web/app/student/enroll/page.tsx
- apps/web/app/student/lectures/[lectureId]/page.tsx
- apps/web/app/student/lectures/[lectureId]/chat/page.tsx
- apps/web/app/student/lectures/[lectureId]/quiz/page.tsx

This route structure shows the two main user roles, with lecture-specific nested pages for review, chat, and quiz workflows.

### Frontend Components

Shared components:

- apps/web/components/shared/Navbar.tsx
- apps/web/components/shared/Sidebar.tsx
- apps/web/components/shared/LoadingSpinner.tsx

Professor-specific components:

- apps/web/components/professor/UploadDropzone.tsx
- apps/web/components/professor/PipelineMonitor.tsx
- apps/web/components/professor/LectureCard.tsx
- apps/web/components/professor/AgentStatusBadge.tsx

Student-specific components:

- apps/web/components/student/VideoPlayer.tsx
- apps/web/components/student/CitationCard.tsx
- apps/web/components/student/ChatInterface.tsx
- apps/web/components/student/NotesPanel.tsx
- apps/web/components/student/QuizWidget.tsx

UI primitives:

- apps/web/components/ui/button.tsx
- apps/web/components/ui/badge.tsx
- apps/web/components/ui/card.tsx
- apps/web/components/ui/dialog.tsx
- apps/web/components/ui/input.tsx

### Frontend Libraries

- apps/web/lib/api-client.ts: API client helpers.
- apps/web/lib/auth.ts: auth helper wiring.
- apps/web/lib/sse-client.ts: SSE streaming client.
- apps/web/lib/utils.ts: general utilities.

### Frontend State

Zustand stores currently present:

- apps/web/store/chat.store.ts
- apps/web/store/lecture.store.ts
- apps/web/store/pipeline.store.ts

### Frontend Types

- apps/web/types/api.ts
- apps/web/types/agent.ts
- apps/web/types/lecture.ts

### Frontend Packaging and Runtime Files

- apps/web/package.json: scripts and dependencies.
- apps/web/next-env.d.ts: Next.js TypeScript declarations.
- apps/web/.env.local.example: example frontend environment variables.

Important dependency set from apps/web/package.json:

- Next.js 15.
- React 18.3.
- next-auth for authentication.
- zustand for client state.
- Tailwind CSS for styling.

## Shared Package: packages/types

- packages/types/package.json: package definition for shared types.
- packages/types/index.ts: package entrypoint.

This package is intended for reusable type definitions shared across apps.

## Infrastructure: infra

Current infra assets:

- infra/docker-compose.yml: local development stack.
- infra/docker-compose.prod.yml: production-oriented compose setup.
- infra/nginx/nginx.conf: reverse proxy config.
- infra/scripts/setup_dev.sh: development bootstrap helper.
- infra/scripts/run_worker.sh: worker startup helper.
- infra/scripts/migrate.sh: migration helper.

The deployment docs say Nginx is used to proxy the app and preserve SSE behavior by disabling buffering for live updates.

## Utility Scripts: scripts

Evaluation and demo helpers are grouped here:

- scripts/demo/generate_demo_video.py: demo video generation.
- scripts/eval/whisper_benchmark.py: transcription benchmarking.
- scripts/eval/manim_llm_eval.py: Manim / LLM evaluation script.

## Documentation

Docs currently present:

- docs/architecture.md: system overview and data flow.
- docs/agent-pipeline.md: pipeline stages and retry strategy.
- docs/api-reference.md: endpoint summary.
- docs/deployment.md: environment and deployment notes.

The documentation currently describes these high-level facts:

- The system uses Next.js, FastAPI, Celery, Redis, PostgreSQL, and pgvector.
- Authentication is JWT-based.
- Lecture endpoints cover CRUD, upload presigning, and pipeline triggers.
- The professor dashboard receives live pipeline updates over SSE.
- Production deploys behind Nginx with SSE proxying configured.

## AI / Media Stack

Current stack references in the repo docs and structure:

- Transcription: faster-whisper, specifically large-v3 in the written context.
- Code generation: DeepSeek-V3 API and/or Qwen2.5-Coder-32B local, depending on execution mode.
- Embeddings: BAAI/bge-small-en-v1.5.
- Rendering: Manim Community Edition.
- Media processing: ffmpeg service and audio helpers.
- Cloud / external integrations: AWS S3 and YouTube Data API v3.

## Current Backend and Frontend Verification State

- The frontend has already been verified as a Next.js app with next@15.0.0, react@18.3.0, and react-dom@18.3.0.
- The local frontend dev server was previously started successfully at http://localhost:3000.
- The current repo already contains the app router, route groups, API auth route, and role-specific dashboards.

## Working Notes for Future Agents

- Treat apps/api/main.py as the API entrypoint and router registration surface.
- Treat apps/api/orchestrator/pipeline.py and apps/api/tasks/pipeline_tasks.py as the main pipeline control points.
- Treat apps/web/lib/sse-client.ts and apps/web/store/pipeline.store.ts as the frontend live-status path.
- Treat apps/web/app/professor/ and apps/web/app/student/ as the two primary user flows.
- Treat apps/api/services/ as the boundary for external APIs, media processing, and retrieval infrastructure.
- Treat apps/api/models/ plus apps/api/db/migrations/versions/ as the canonical source for persisted domain objects.

## Last Updated

2026-06-12
