# Agent Pipeline

## Pipeline Stages

The pipeline runs ingest, transcription, segmentation, codegen, render, composition, indexing, and publish agents.
Each agent reports progress events that are surfaced in the professor dashboard.

## Retry Strategy

Agents use bounded retries with error context to recover from transient failures.
Persistent failures are logged for review and manual intervention.
