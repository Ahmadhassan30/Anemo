# agentic-framwork-for-lecture-to-animation

## Overview

This is an agentic AI SaaS platform that turns raw professor lectures into 3Blue1Brown-style animated educational videos.
It includes a Professor Portal for uploads and live pipeline monitoring, and a Student Portal for videos, quizzes, and a RAG chatbot.

## Monorepo Layout

The repo is a Turbo monorepo with a Next.js frontend in apps/web, a FastAPI backend in apps/api, and shared types in packages/types.
Infrastructure assets and scripts live under infra and scripts, with docs under docs.

## Tech Stack

Next.js 15 powers the UI, FastAPI and Celery handle agent orchestration, and PostgreSQL with pgvector stores relational and vector data.
Manim renders animations, faster-whisper transcribes audio, and LLMs generate code and educational artifacts.

## Development Workflow

Use Turbo to run workspace tasks and keep frontend and backend in sync.
Environment variables are documented in .env.example files across the repo.

## Documentation

Architecture, pipeline, API, and deployment notes live in the docs folder.
Start with the architecture document for a high-level system overview.
