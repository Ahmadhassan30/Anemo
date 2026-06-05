"""RAG indexing agent for embeddings and pgvector upserts."""
from agents.base import BaseAgent


class RagIndexingAgent(BaseAgent):
    """Embed transcript chunks and upsert into pgvector."""

    name = "rag_indexing"

    async def run(self, lecture_id: str) -> None:
        # TODO: chunk transcript and store embeddings
        pass
