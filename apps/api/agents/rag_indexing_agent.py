"""RAG indexing agent for embeddings and pgvector upserts."""
import asyncio
import logging
from typing import Any, Dict

from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import BaseAgent
from models.embedding import Embedding
from utils.chunking import chunk_text

logger = logging.getLogger(__name__)


class RagIndexingAgent(BaseAgent):
    """Embed transcript chunks and upsert into pgvector."""

    name = "rag_indexing_agent"

    # Class-level singleton loaded once
    _model = None

    def __init__(self):
        super().__init__()
        if RagIndexingAgent._model is None:
            logger.info("Loading SentenceTransformer BAAI/bge-small-en-v1.5 ...")
            RagIndexingAgent._model = SentenceTransformer("BAAI/bge-small-en-v1.5")

    async def run(
        self,
        lecture_id: str,
        db: AsyncSession,
        *,
        transcript: dict,
        concepts: list[dict],
        **kwargs,
    ) -> dict:
        """Embed text chunks per concept and batch insert them to pgvector."""
        logger.info("Starting RAG indexing for lecture %s", lecture_id)

        segments = transcript.get("segments", [])
        embeddings_created = 0
        concepts_indexed = 0
        
        batch = []
        batch_size = 50

        # We will use this model for the thread
        model = RagIndexingAgent._model

        # 1. For each concept, collect its transcript segments
        for concept in concepts:
            ts_start = concept.get("ts_start", 0.0)
            ts_end = concept.get("ts_end", 0.0)
            concept_id = concept.get("id")

            # Collect segments strictly within the concept time bounds
            # Or segments that overlap. We use a simple midpoint test.
            concept_texts = []
            segment_start = None
            
            for seg in segments:
                seg_start = seg.get("start", 0.0)
                seg_end = seg.get("end", 0.0)
                midpoint = (seg_start + seg_end) / 2.0

                if ts_start <= midpoint <= ts_end:
                    concept_texts.append(seg.get("text", ""))
                    if segment_start is None:
                        segment_start = seg_start

            if not concept_texts:
                continue

            full_text = " ".join(concept_texts)

            # 2. Chunk the concept text
            chunks = chunk_text(full_text, max_tokens=200, overlap=20)
            
            for chunk in chunks:
                # 3. Encode chunk via asyncio.to_thread
                vector = await asyncio.to_thread(model.encode, chunk)
                
                # 4. Create Embedding row object
                emb = Embedding(
                    lecture_id=lecture_id,
                    concept_id=concept_id,
                    chunk_text=chunk,
                    vector=vector.tolist(),
                    ts_start=segment_start if segment_start is not None else ts_start
                )
                batch.append(emb)

            concepts_indexed += 1

            # 5. Batch insert embeddings
            if len(batch) >= batch_size:
                db.add_all(batch)
                await db.commit()
                embeddings_created += len(batch)
                batch.clear()

        # Insert remaining
        if batch:
            db.add_all(batch)
            await db.commit()
            embeddings_created += len(batch)

        logger.info("Indexed %d concepts, %d embeddings created for lecture %s", concepts_indexed, embeddings_created, lecture_id)

        return {
            "embeddings_created": embeddings_created,
            "concepts_indexed": concepts_indexed
        }
