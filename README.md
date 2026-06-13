# LectureOS: Agentic Framework for Lecture-to-Animation

LectureOS is a state-of-the-art agentic AI SaaS platform designed to automatically transform raw spoken lecture recordings from professors into high-fidelity, visually rich, 3Blue1Brown-style educational animations. By utilizing a pipeline of specialized AI agents—ranging from ingestion, transcription, and chunk segmentation, to code generation, composition, and publishing—the system generates beautiful video sequences complete with synchronized professor audio, burned subtitles, and matching animated visual elements rendered using Manim.

On top of its processing pipeline, LectureOS hosts a dual-portal interface built for modern educational environments. The Professor Portal offers real-time pipeline status monitoring through Server-Sent Events (SSE) streams and one-click uploads, while the Student Portal hosts an immersive study dashboard containing an custom-controlled HTML5 media player, chapter navigation, dynamically generated interactive quizzes, and a Retrieval-Augmented Generation (RAG) study-assistant chatbot referenced directly to lecture transcript segments.

## Architecture Diagram

```
                                 +--------------------+
                                 |  Nginx Controller  |
                                 |     (Port 80)      |
                                 +---------+----------+
                                           |
                    +----------------------+----------------------+
                    | (Static & SSR)                              | (API & SSE Requests)
                    v                                             v
        +-----------+-----------+                     +-----------+-----------+
        |     Web (Next.js)     |                     |     FastAPI Server    |
        |      (Port 3000)      |                     |      (Port 8000)      |
        +-----------------------+                     +-----+-----------+-----+
                                                            |           |
                                      +---------------------+           +---------------------+
                                      | (Celery Tasks)                                        |
                                      v                                                       v
                            +---------+---------+                                   +---------+---------+
                            |   Celery Worker   |                                   |  Postgres Database|
                            | (Manim + Whisper) |                                   |    (pgvector)     |
                            +---------+---------+                                   +---------+---------+
                                      |                                                       ^
                                      +--------------------> [ Redis Cache ] -----------------+
                                                             (Task Broker)
```

## Quick Start

### Prerequisites
- **Git**
- **Docker & Docker Compose** (version 2.0 or higher recommended)
- Python 3.11 (for running local migrations and seeders)
- Node.js 20 & `pnpm` (for local frontend development optional, Docker handles containerized builds)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ahmadhassan30/agentic-framwork-for-lecture-to-animation.git
   cd agentic-framwork-for-lecture-to-animation
   ```

2. **Copy the environment configuration file**
   ```bash
   cp .env.example .env
   ```

3. **Configure API Credentials**
   Open the root `.env` file and fill in required keys such as:
   - `DEEPSEEK_API_KEY`
   - `UPLOADTHING_SECRET` & `UPLOADTHING_APP_ID`
   - `YOUTUBE_CLIENT_ID` & `YOUTUBE_CLIENT_SECRET` (if integration is desired)

4. **Initialize and run the local development stack**
   ```bash
   ./infra/scripts/setup_dev.sh
   ```

The script will automatically handle environment setup, boot database dependencies, run migrations, seed initial demo accounts, and spin up the web client, API server, worker pipeline, and Nginx proxy.

## Demo Credentials

You can use the following seeded accounts to log in and test the portals at `http://localhost`:

| Role | Email | Password |
|---|---|---|
| **Professor** | `professor@demo.com` | `demo1234` |
| **Student** | `student@demo.com` | `demo1234` |

## Documentation

For deep dives into components, routing systems, design guidelines, and database architectures, please check out the files in the [docs/](file:///c:/Users/ahmad/Desktop/agentic-framwork-for-lecture-to-animation/docs) directory:
- [Architecture Guide](file:///c:/Users/ahmad/Desktop/agentic-framwork-for-lecture-to-animation/docs/architecture.md) (if present)
- [API Endpoints Reference](file:///c:/Users/ahmad/Desktop/agentic-framwork-for-lecture-to-animation/docs/api.md) (if present)

