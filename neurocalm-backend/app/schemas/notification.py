from pydantic import BaseModel


class NotificationPreferenceOut(BaseModel):
    email_notifications: bool
    analysis_complete: bool
    weekly_summary: bool

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    email_notifications: bool | None = None
    analysis_complete: bool | None = None
    weekly_summary: bool | None = None
