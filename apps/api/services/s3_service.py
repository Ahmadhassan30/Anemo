"""S3 helpers for uploads and presigned URLs."""
from typing import Optional


class S3Service:
    """Wrapper around S3 operations."""

    def __init__(self) -> None:
        # TODO: initialize boto3 client
        pass

    def create_presigned_upload(self, key: str) -> str:
        # TODO: generate presigned upload URL
        pass

    def delete_object(self, key: str) -> None:
        # TODO: delete object from bucket
        pass
