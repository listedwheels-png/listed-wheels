from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Application status: ok or degraded")
    app: str = Field(default="ListedWheels", description="Application name")
    environment: str = Field(default="development", description="Current environment")
    version: str = Field(default="0.1.0", description="API version")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Server UTC timestamp")
    database: Optional[str] = Field(default=None, description="Database connection status (connected/unreachable)")
