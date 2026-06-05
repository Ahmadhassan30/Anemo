"""YouTube OAuth2 callback and channel info routes."""
from fastapi import APIRouter

router = APIRouter(prefix="/youtube", tags=["youtube"])


@router.get("/callback")
async def oauth_callback():
    # TODO: handle OAuth2 callback and token exchange
    pass


@router.get("/channel")
async def channel_info():
    # TODO: fetch connected channel details
    pass
