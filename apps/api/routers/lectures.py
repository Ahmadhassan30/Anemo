"""Lecture CRUD routes and S3 upload helpers."""
from fastapi import APIRouter

router = APIRouter(prefix="/lectures", tags=["lectures"])


@router.get("")
async def list_lectures():
    # TODO: return lecture list for user
    pass


@router.post("")
async def create_lecture():
    # TODO: create lecture metadata and upload target
    pass


@router.get("/{lecture_id}")
async def get_lecture(lecture_id: str):
    # TODO: fetch a lecture by id
    pass


@router.post("/{lecture_id}/presign")
async def create_presigned_upload(lecture_id: str):
    # TODO: generate S3 presigned URL
    pass


@router.delete("/{lecture_id}")
async def delete_lecture(lecture_id: str):
    # TODO: delete lecture and related assets
    pass
