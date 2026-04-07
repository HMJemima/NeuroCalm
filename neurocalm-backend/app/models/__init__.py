# Import all models so they are registered with Base.metadata
from app.models.user import User
from app.models.analysis import Analysis
from app.models.notification_preference import NotificationPreference
from app.models.system_setting import SystemSettings
from app.models.password_reset import PasswordResetToken

__all__ = ["User", "Analysis", "NotificationPreference", "SystemSettings", "PasswordResetToken"]
