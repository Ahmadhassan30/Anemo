"""Auth request and response schemas."""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Login payload schema."""

    # TODO: add email and password fields
    pass


class RegisterRequest(BaseModel):
    """Registration payload schema."""

    # TODO: add user registration fields
    pass
