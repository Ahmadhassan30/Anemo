# Deployment

## Environments

Anemo supports local development with Docker Compose and production deployments with hardened configs.
Environment variables are defined in .env.example files per service.

## Infrastructure

PostgreSQL, Redis, and worker services run behind an Nginx reverse proxy.
SSE proxy buffering is disabled to ensure live pipeline updates.

