from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    auth_provider: str = "local"
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class UserStats(BaseModel):
    total_analyses: int
    avg_stress_score: float
    last_analysis_at: datetime | None
    trend: str


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    is_active: bool | None = None


class AdminUserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: str = "user"
    is_active: bool = True


class AdminUserOut(UserOut):
    analyses_count: int = 0
