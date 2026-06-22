"""Application settings loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed settings for the LectureOS backend."""

    APP_ENV: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    GROQ_API_KEY: str
    YOUTUBE_CLIENT_ID: str = "your_youtube_client_id"
    YOUTUBE_CLIENT_SECRET: str = "your_youtube_client_secret"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24
    WHISPER_MODEL_SIZE: str = "large-v3"
    MANIM_OUTPUT_DIR: str = "/tmp/manim_output"
    MAX_RENDER_RETRIES: int = 5
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Timeout / robustness policy (longer videos => more, bigger scenes) ──
    LLM_CALL_TIMEOUT: float = 45.0          # per LLM request, seconds
    TTS_TIMEOUT: float = 60.0               # per narration synthesis, seconds
    MANIM_RENDER_TIMEOUT_BASE: float = 180.0    # floor for any scene render
    MANIM_RENDER_TIMEOUT_MAX: float = 420.0     # ceiling for any scene render
    MANIM_RENDER_TIMEOUT_PER_SEC: float = 8.0   # extra render-budget per output-second
    CELERY_SOFT_TIME_LIMIT: int = 3600          # whole pipeline, soft (s)
    CELERY_HARD_TIME_LIMIT: int = 4200          # whole pipeline, hard (s)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
