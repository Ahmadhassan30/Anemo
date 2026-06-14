"""Chat message model for RAG conversation history."""

from sqlalchemy import Column, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from models.base import Base, TimestampMixin, UUIDMixin


class ChatMessage(UUIDMixin, TimestampMixin, Base):
    """A single message in a student's conversation with a lecture RAG bot."""
    __allow_unmapped__ = True

    __tablename__ = "chat_messages"

    lecture_id = Column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    lecture = relationship("Lecture")
    student = relationship("User")
