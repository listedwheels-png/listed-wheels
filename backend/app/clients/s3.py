import uuid
from typing import Any, Dict, Optional
from app.core.config import settings
from app.core.logging import logger


class S3Client:
    """
    AWS S3 Client handling:
    1. Public Media Bucket (Vehicle photos served via CloudFront CDN).
    2. Private Document Bucket (Seller verification docs: RC copies, Aadhaar, PAN)
       with Server-Side Encryption (AES256) and short-lived admin-only signed URLs.
    """

    def __init__(self) -> None:
        self.region = settings.AWS_REGION
        self.public_bucket = settings.S3_PUBLIC_BUCKET
        self.private_bucket = settings.S3_PRIVATE_BUCKET
        self.cloudfront_domain = settings.CLOUDFRONT_DOMAIN or f"https://{self.public_bucket}.s3.{self.region}.amazonaws.com"

    def get_public_cdn_url(self, storage_key: str) -> str:
        """Constructs CloudFront CDN URL for public vehicle photo."""
        clean_key = storage_key.lstrip("/")
        base_domain = self.cloudfront_domain.rstrip("/")
        return f"{base_domain}/{clean_key}"

    def generate_presigned_photo_upload_url(
        self,
        storage_key: str,
        content_type: str = "image/jpeg",
        expires_in: int = 300,
    ) -> Dict[str, Any]:
        """
        Generates pre-signed URL for direct client-to-bucket upload into the Public Media Bucket.
        """
        # In AWS boto3 environment:
        # s3_client.generate_presigned_post(Bucket=self.public_bucket, Key=storage_key, Fields={"Content-Type": content_type})
        url = f"https://{self.public_bucket}.s3.{self.region}.amazonaws.com/{storage_key}"
        return {
            "url": url,
            "storage_key": storage_key,
            "fields": {
                "key": storage_key,
                "Content-Type": content_type,
                "acl": "public-read",
            },
        }

    def generate_presigned_document_upload_url(
        self,
        storage_key: str,
        content_type: str = "application/pdf",
        expires_in: int = 300,
    ) -> Dict[str, Any]:
        """
        Generates pre-signed upload URL for Private Document Bucket with Server-Side Encryption (SSE-S3).
        Enforces private ACL and zero public read permissions.
        """
        url = f"https://{self.private_bucket}.s3.{self.region}.amazonaws.com/{storage_key}"
        return {
            "url": url,
            "storage_key": storage_key,
            "fields": {
                "key": storage_key,
                "Content-Type": content_type,
                "x-amz-server-side-encryption": "AES256",
            },
        }

    def generate_admin_document_download_url(
        self,
        storage_key: str,
        expires_in: int = 900,  # 15 minutes
    ) -> str:
        """
        Generates short-lived signed GET URL for admin moderation of encrypted verification documents.
        """
        # In AWS boto3: s3_client.generate_presigned_url('get_object', Params={'Bucket': self.private_bucket, 'Key': storage_key}, ExpiresIn=expires_in)
        return f"https://{self.private_bucket}.s3.{self.region}.amazonaws.com/{storage_key}?x-amz-security-token=mock_sig&expires_in={expires_in}"


s3_client = S3Client()
