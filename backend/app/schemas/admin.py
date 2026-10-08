import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.listing import ListingResponse


class QueueDocumentItem(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    user_name: str
    doc_type: str
    storage_key: str
    secure_download_url: str
    status: str
    created_at: datetime


class AdminQueueResponse(BaseModel):
    pending_listings: List[ListingResponse]
    pending_documents: List[QueueDocumentItem]
    total_pending_listings: int
    total_pending_documents: int


class RejectListingRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000, description="Mandatory reason for listing rejection")


class BanUserRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000, description="Reason for permanent user ban")


class ApproveDocumentRequest(BaseModel):
    pass


class RejectDocumentRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=1000, description="Reason for document rejection")


class AdminActionResponse(BaseModel):
    success: bool = True
    action: str
    entity_id: uuid.UUID
    message: str
