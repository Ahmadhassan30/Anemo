"""User model for professor and student accounts."""
import enum

from sqlalchemy import Boolean, Column, Enum as SAEnum, String, Text
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class UserRole(enum.Enum):
    """Supported user roles."""

    professor = "professor"
    student = "student"


class User(UUIDMixin, TimestampMixin, Base):
    """User entity for authentication and roles."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(Text, nullable=False)
    role = Column(SAEnum(UserRole, name="user_role"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")

    lectures = relationship(
        "Lecture",
        back_populates="professor",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    enrollments = relationship(
        "Lecture",
        secondary="enrollments",
        back_populates="students",
    )
