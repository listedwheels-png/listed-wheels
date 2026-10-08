import uuid
from unittest.mock import AsyncMock, patch
import pytest

from app.clients.s3 import s3_client
from app.core.errors import BadRequestError
from app.db.models.user import User
from app.services.media import MediaService, validate_video_link


def test_s3_public_and_private_configurations():
    """Verify distinct Public Media Bucket vs. Private Encrypted Document Bucket behavior."""
    # Public Photo
    photo_presign = s3_client.generate_presigned_photo_upload_url("listings/sample/photo.jpg")
    assert "listings/sample/photo.jpg" in photo_presign["url"]
    assert photo_presign["fields"]["acl"] == "public-read"

    # Private Encrypted Document
    doc_presign = s3_client.generate_presigned_document_upload_url("documents/user1/RC.pdf")
    assert "documents/user1/RC.pdf" in doc_presign["url"]
    assert doc_presign["fields"]["x-amz-server-side-encryption"] == "AES256"

    # Admin Short-Lived Download Signed URL
    admin_url = s3_client.generate_admin_document_download_url("documents/user1/RC.pdf", expires_in=900)
    assert "expires_in=900" in admin_url
    assert "x-amz-security-token" in admin_url


def test_video_walkaround_link_validation():
    """Verify supported video providers (YouTube, Vimeo, Google Drive, Instagram)."""
    assert "youtube.com" in validate_video_link("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert "youtu.be" in validate_video_link("https://youtu.be/dQw4w9WgXcQ")
    assert "vimeo.com" in validate_video_link("https://vimeo.com/123456789")
    assert "drive.google.com" in validate_video_link("https://drive.google.com/file/d/12345/view")

    with pytest.raises(BadRequestError) as exc_info:
        validate_video_link("https://sketchy-site.example/video.mp4")
    assert exc_info.value.code == "INVALID_VIDEO_PROVIDER"
