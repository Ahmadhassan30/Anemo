"""Application settings loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed settings for the LectureOS backend."""

    APP_ENV: str = "development"
    DATABASE_URL: str
    REDIS_URL: str
    DEEPSEEK_API_KEY: str
    YOUTUBE_CLIENT_ID: str
    YOUTUBE_CLIENT_SECRET: str
    UPLOADTHING_SECRET: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24
    WHISPER_MODEL_SIZE: str = "large-v3"
    MANIM_OUTPUT_DIR: str = "/tmp/manim_output"
    MAX_RENDER_RETRIES: int = 5
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
