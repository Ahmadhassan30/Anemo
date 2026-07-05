# Architecture

## System Overview

Anemo uses a Next.js frontend, a FastAPI backend, and Celery workers to run the agentic pipeline.
PostgreSQL with pgvector stores relational data and embeddings for the RAG chatbot.

## Data Flow

Lecture uploads move through ingestion, transcription, segmentation, rendering, and publishing stages.
Events are streamed to the professor portal over SSE for real-time monitoring.

