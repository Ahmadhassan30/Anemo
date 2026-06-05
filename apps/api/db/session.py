"""Database session and engine setup."""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# TODO: read database URL from settings
engine = create_async_engine("", echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an async database session."""

    # TODO: provide session lifecycle management
    async with async_session() as session:
        yield session
