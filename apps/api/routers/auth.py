"""Authentication routes for JWT login and registration."""
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login():
    # TODO: implement JWT login
    pass


@router.post("/register")
async def register():
    # TODO: implement user registration
    pass


@router.get("/me")
async def me():
    # TODO: return current user profile
    pass
