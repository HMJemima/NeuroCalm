from datetime import datetime

from pydantic import BaseModel


# --- Admin Analyses ---

class AdminAnalysisItem(BaseModel):
    id: str
    user: str
    file: str
    result: str
    confidence: str
    date: str
    status: str

    class Config:
        from_attributes = True


class AdminAnalysesResponse(BaseModel):
    items: list[AdminAnalysisItem]
    total: int
    page: int
    page_size: int


# --- Analytics ---

class AnalyticsDailyItem(BaseModel):
    name: str
    analyses: int


class AnalyticsDistributionItem(BaseModel):
    range: str
    count: int


class AnalyticsResponse(BaseModel):
    daily: list[AnalyticsDailyItem]
    distribution: list[AnalyticsDistributionItem]
    total_this_week: int
    total_this_month: int
    avg_stress_score: float


# --- Server ---

class ServerResourceStat(BaseModel):
    label: str
    value: str
    bar: int


class ServerServiceStatus(BaseModel):
    name: str
    status: str
    uptime: str
    port: str


class ServerLogEntry(BaseModel):
    time: str
    level: str
    message: str


class ServerStatusResponse(BaseModel):
    resources: list[ServerResourceStat]
    services: list[ServerServiceStatus]
    logs: list[ServerLogEntry]


# --- System Settings ---

class SystemSettingsOut(BaseModel):
    maintenance_mode: bool
    allow_registration: bool
    max_upload_size_mb: int
    rate_limit_per_minute: int
    storage_backend: str
    auto_delete_days: int

    class Config:
        from_attributes = True


class SystemSettingsUpdate(BaseModel):
    maintenance_mode: bool | None = None
    allow_registration: bool | None = None
    max_upload_size_mb: int | None = None
    rate_limit_per_minute: int | None = None
    storage_backend: str | None = None
    auto_delete_days: int | None = None
