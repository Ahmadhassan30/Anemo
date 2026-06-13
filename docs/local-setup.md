# Running LectureOS Locally

> **Windows users**: Run all `pnpm` commands in a **WSL2 terminal** (Ubuntu),
> not PowerShell or CMD. The shell scripts use bash.

## Prerequisites

- Docker Desktop installed and **RUNNING** (whale icon in taskbar must be still)
- Node.js 20+
- pnpm 9: `npm install -g pnpm@9`
- Git
- A free UploadThing account: https://uploadthing.com

## Required API Keys

Before running setup you need:

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| UPLOADTHING_SECRET | uploadthing.com/dashboard | **YES** |
| UPLOADTHING_APP_ID | uploadthing.com/dashboard | **YES** |
| DEEPSEEK_API_KEY | platform.deepseek.com | **YES** |
| JWT_SECRET | run: `openssl rand -hex 32` | **YES** |
| NEXTAUTH_SECRET | run: `openssl rand -hex 32` | **YES** |
| YOUTUBE_CLIENT_ID | console.cloud.google.com | Optional |
| YOUTUBE_CLIENT_SECRET | console.cloud.google.com | Optional |

YouTube keys are optional. The pipeline will render and compose the
video locally — it just skips the YouTube publish step if credentials
are placeholders.

## First Time Setup

```bash
git clone <repo>
cd agentic-framwork-for-lecture-to-animation

# Run setup — creates env files, installs deps, starts Docker services,
# runs migrations, seeds demo data
pnpm setup
```

Then open `apps/api/.env` and `apps/web/.env.local` and fill in your keys.
Then restart: `docker compose -f infra/docker-compose.yml restart`

Open http://localhost in your browser.

## Daily Usage

```bash
# Start everything
docker compose -f infra/docker-compose.yml up -d

# Verify everything is healthy
pnpm health

# Stop everything (keeps your data)
pnpm stop

# View all logs live
pnpm logs

# View only API logs
pnpm logs:api

# View only Celery worker logs (pipeline progress, Whisper, Manim)
pnpm logs:worker

# Re-run migrations after changing a model
pnpm migrate

# Full reset (wipes database)
pnpm stop     # select y when asked about volumes
pnpm setup
```

## How Uploads Work

Professor video uploads go directly from the browser to UploadThing
CDN servers. The flow is:

1. Professor drags video onto the upload page
2. Browser contacts UploadThing API (using your `UPLOADTHING_SECRET`)
3. Video uploads directly to UploadThing — never touches your server
4. UploadThing returns a CDN URL (`https://utfs.io/f/...`)
5. Frontend sends that URL to your FastAPI backend
6. Backend saves the URL and triggers the pipeline

Manim-rendered clips and the final composed video are saved to
`/tmp/manim_output/` inside the worker container and served by
FastAPI at `http://localhost/static/`

## Where Each Service Runs

| Service | URL | What it does |
|---------|-----|-------------|
| App (Nginx) | http://localhost | Entry point for everything |
| Frontend | http://localhost:3000 | Next.js (also via Nginx on :80) |
| API | http://localhost:8000 | FastAPI (also via Nginx on :80) |
| API Docs | http://localhost/api/v1/docs | Swagger UI |
| Postgres | localhost:5432 | Database |
| Redis | localhost:6379 | Celery broker |
| Celery Worker | (no port) | Runs pipeline agents in background |

## Demo Credentials

- **Professor**: professor@demo.com / demo1234
- **Student**: student@demo.com / demo1234

## Common Issues

### "Port 80 already in use"
IIS or another web server is using port 80 on Windows.
**Fix**: Open Services (`services.msc`), stop "World Wide Web Publishing Service".
Or change Nginx port in `docker-compose.yml`: `"8080:80"` and use
`http://localhost:8080` instead.

### "Port 5432 already in use"
A local Postgres installation is running.
**Fix**: In Services, stop "postgresql-x64-XX". Or change compose mapping
to `"5433:5432"` and update `DATABASE_URL` to use port 5433 when running
outside Docker.

### "Cannot connect to Docker daemon"
Docker Desktop is not running.
**Fix**: Open Docker Desktop from Start menu, wait until the whale icon
in the taskbar stops animating (takes 30-60 seconds).

### "UploadThing upload fails"
Either `UPLOADTHING_SECRET` is wrong, or `UPLOADTHING_APP_ID` does not
match the secret.
**Fix**: Go to uploadthing.com/dashboard, copy both values again,
paste into `apps/web/.env.local`, then:
```bash
docker compose -f infra/docker-compose.yml restart web
```

### "Whisper model downloading, worker seems frozen"
This is normal on first run. The `large-v3` model is ~3GB and downloads
inside the worker container. Watch it with:
```bash
pnpm logs:worker
```
You will see download progress. It only happens once — the model
is cached in the Docker volume after that.
To speed up local testing, change `WHISPER_MODEL_SIZE=base` in
`apps/api/.env` (much smaller, slightly less accurate).

### "Manim render fails with missing library"
Cairo, Pango, or LaTeX is missing inside the worker container.
**Fix**: rebuild the worker image from scratch:
```bash
docker compose -f infra/docker-compose.yml build worker --no-cache
docker compose -f infra/docker-compose.yml up -d worker
```

### "SSE pipeline dashboard shows nothing / never updates"
Nginx is buffering the SSE stream.
**Fix**: Verify `infra/nginx/nginx.conf` has this block for the status route:
```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 3600;
proxy_set_header Connection '';
```
Then: `docker compose -f infra/docker-compose.yml restart nginx`

### "Pipeline completes but no YouTube link"
Expected if `YOUTUBE_CLIENT_ID` is a placeholder. The video is still
rendered and available at `http://localhost/static/{lectureId}/final.mp4`.
Add real YouTube OAuth credentials when you need the publish step.

### DATABASE_URL connection refused
If running FastAPI outside Docker, the host must be `localhost:5432`.
Inside Docker, it must be `postgres:5432`.
The `.env` file uses the Docker service name. Do not change it unless
you are running the API directly on your machine.
