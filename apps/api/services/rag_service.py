"""RAG service for embeddings and retrieval."""
from typing import List


class RagService:
    """Embed transcript chunks and retrieve citations."""

    def embed(self, chunks: List[str]) -> List[list[float]]:
        # TODO: call embedding model
        pass

    def retrieve(self, query: str) -> List[dict]:
        # TODO: query pgvector for nearest chunks
        pass

    def answer_with_citation(self, query: str) -> dict:
        # TODO: compose answer with timestamp citations
        pass
