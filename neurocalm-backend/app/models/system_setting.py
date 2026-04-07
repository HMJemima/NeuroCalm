import uuid

from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    maintenance_mode: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_registration: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    max_upload_size_mb: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    storage_backend: Mapped[str] = mapped_column(String(50), default="local", nullable=False)
    auto_delete_days: Mapped[int] = mapped_column(Integer, default=90, nullable=False)
