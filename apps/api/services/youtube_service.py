"""YouTube OAuth2 and upload service."""
from typing import Dict

class YouTubeService:
    """Handle YouTube OAuth2 and publishing."""

    def get_auth_url(self) -> str:
        # TODO: return OAuth2 authorization URL
        pass

    def exchange_code(self, code: str) -> dict:
        # TODO: exchange auth code for tokens
        pass

    def upload_video(self, file_path: str, metadata: dict) -> str:
        # TODO: upload video and return YouTube ID
        pass
