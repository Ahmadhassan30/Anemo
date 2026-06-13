"""Chunking utilities for transcript segmentation."""
from typing import List
import tiktoken


def chunk_text(text: str, max_tokens: int = 200, overlap: int = 20) -> List[str]:
    """Split text into chunks of at most `max_tokens` with `overlap` using tiktoken.

    Args:
        text: The source text to chunk.
        max_tokens: Maximum number of tokens per chunk.
        overlap: Number of overlapping tokens between consecutive chunks.

    Returns:
        A list of text chunks. Each chunk will have at least 20 tokens unless 
        the source text itself is shorter than 20 tokens.
    """
    if not text.strip():
        return []

    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)

    # If the text is shorter than max_tokens, return it as a single chunk
    if len(tokens) <= max_tokens:
        return [text]

    chunks = []
    step = max_tokens - overlap

    for i in range(0, len(tokens), step):
        # Slice tokens for this chunk
        chunk_tokens = tokens[i : i + max_tokens]
        
        # Enforce minimum of 20 tokens for the last chunk, if possible
        if i > 0 and len(chunk_tokens) < 20:
            # If the remainder is too small, extend it backwards to grab 20 tokens
            # assuming we have at least 20 tokens total (which we checked above)
            chunk_tokens = tokens[max(0, len(tokens) - 20) : len(tokens)]
            if chunk_tokens in [enc.encode(c) for c in chunks]:
                # already covered or duplicate remainder
                break

        chunks.append(enc.decode(chunk_tokens))

    return chunks
