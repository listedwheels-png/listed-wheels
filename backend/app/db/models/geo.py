import uuid
from typing import List
from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import TimestampedModel


class State(TimestampedModel):
    __tablename__ = "states"

    code: Mapped[str] = mapped_column(String(2), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)

    cities: Mapped[List["City"]] = relationship("City", back_populates="state", cascade="all, delete-orphan")


class City(TimestampedModel):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint("state_id", "slug", name="uq_cities_state_slug"),
    )

    state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("states.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    is_popular: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    state: Mapped["State"] = relationship("State", back_populates="cities")
