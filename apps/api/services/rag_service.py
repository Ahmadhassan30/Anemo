"""RAG service for embeddings and retrieval."""
from typing import List
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sentence_transformers import SentenceTransformer
import asyncio
import logging
from services.llm_service import llm_service

logger = logging.getLogger(__name__)

# Single instance to prevent reloading model on every request
_embedder = None

def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info("Loading BAAI/bge-small-en-v1.5 sentence transformer...")
        _embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _embedder

class RAGService:
    """Embed transcript chunks and retrieve citations."""

    async def retrieve(
        self, query: str, lecture_id: str, db: AsyncSession, top_k: int = 5
    ) -> List[dict]:
        """Retrieve top-k chunks from the embedding store for a query."""
        embedder = _get_embedder()
        
        # 1. Encode query
        # We run it in a thread to not block the event loop
        query_vector = await asyncio.to_thread(embedder.encode, query)
        
        # 2. Run pgvector cosine similarity search
        stmt = text("""
            SELECT chunk_text, ts_start, concept_id,
                   1 - (vector <=> :query_vector::vector) AS similarity
            FROM embeddings 
            WHERE lecture_id = :lecture_id
            ORDER BY vector <=> :query_vector::vector
            LIMIT :top_k
        """)
        
        result = await db.execute(
            stmt,
            {
                "query_vector": query_vector.tolist(),
                "lecture_id": lecture_id,
                "top_k": top_k
            }
        )
        
        # 3. Return list of dicts
        chunks = []
        for row in result.mappings():
            chunks.append({
                "chunk_text": row["chunk_text"],
                "ts_start": float(row["ts_start"]) if row["ts_start"] is not None else 0.0,
                "similarity": float(row["similarity"]),
                "concept_id": str(row["concept_id"]) if row["concept_id"] else None
            })
            
        return chunks

    async def answer(self, query: str, lecture_id: str, db: AsyncSession) -> dict:
        """Answer a query using retrieved context chunks."""
        # 1. Retrieve top-5 chunks
        chunks = await self.retrieve(query, lecture_id, db, top_k=5)
        
        if not chunks:
            return {"answer": "No relevant context found in this lecture.", "citations": []}

        # 2. Format context
        context_lines = []
        citations = []
        for i, c in enumerate(chunks, 1):
            ts = c["ts_start"]
            mins, secs = int(ts // 60), int(ts % 60)
            ts_str = f"[{mins:02d}:{secs:02d}]"
            context_lines.append(f"Passage {i} {ts_str}:\n{c['chunk_text']}\n")
            citations.append({
                "ts_start": ts,
                "chunk_text": c["chunk_text"],
                "concept_id": c["concept_id"]
            })
            
        context = "\n".join(context_lines)

        # 3. Call LLM
        system = (
            "Answer using only the provided lecture context. "
            "Cite timestamps like [12:34] when referencing specific moments."
        )
        user = f"Context:\n{context}\n\nQuestion: {query}"
        
        answer_text = await llm_service.chat(system=system, user=user)

        # 4. Return
        return {
            "answer": answer_text,
            "citations": citations
        }
