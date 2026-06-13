"""UploadThing service wrapper for uploading backend pipeline outputs."""
import httpx
from pathlib import Path

from config import settings


class UploadThingService:
    """Service to upload final produced videos to UploadThing."""

    async def upload_file(self, file_path: str) -> str:
        """Upload a local file to UploadThing using UTAPI and return its URL."""
        url = "https://uploadthing.com/api/uploadFiles"
        
        headers = {
            "x-uploadthing-api-key": settings.UPLOADTHING_SECRET
        }
        
        path_obj = Path(file_path)
        
        async with httpx.AsyncClient(timeout=600) as client:
            with open(file_path, "rb") as f:
                # We send the file with its filename
                files = {"files": (path_obj.name, f, "video/mp4")}
                # By default UTAPI uploads use 'public-read' ACL
                data = {"acl": "public-read"}
                
                response = await client.post(
                    url,
                    files=files,
                    data=data,
                    headers=headers,
                )
                response.raise_for_status()
                
                # UTAPI /uploadFiles returns a list of results:
                # [ { "key": "...", "url": "https://utfs.io/f/...", "name": "...", "size": ... } ]
                result = response.json()
                return result[0]["url"]


uploadthing_service = UploadThingService()
