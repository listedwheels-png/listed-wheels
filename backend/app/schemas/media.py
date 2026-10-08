import uuid
from typing import Dict, Optional
from pydantic import BaseModel, Field


class PhotoPresignRequest(BaseModel):
    file_name: str = Field(description="Original image file name")
    content_type: str = Field(default="image/jpeg", description="MIME type (image/jpeg, image/png, image/webp)")


class PhotoPresignResponse(BaseModel):
    upload_url: str
    storage_key: str
    fields: Dict[str, str] = {}


class PhotoRegisterRequest(BaseModel):
    storage_key: str
    position: int = 0


class VideoLinkRequest(BaseModel):
    link: str = Field(description="URL to YouTube, Google Drive, or Instagram video link")
    consent: bool = Field(default=True, description="Consent for social media reposting")
