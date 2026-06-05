"""User model for professor and student accounts."""
from sqlalchemy import Column, DateTime, Enum, String

from models.base import Base


class User(Base):
    """User entity for authentication and roles."""

    __tablename__ = "users"

    # TODO: define columns: id, email, role, created_at
    pass
