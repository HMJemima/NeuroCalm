from functools import lru_cache
from urllib.parse import parse_qsl, quote_plus, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "neurocalm"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    SECRET_KEY: str = "change-this-to-a-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    FRONTEND_URL: str = "http://localhost:5173"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    MICROSOFT_CLIENT_ID: str = ""
    MICROSOFT_CLIENT_SECRET: str = ""
    MICROSOFT_TENANT_ID: str = "common"

    # ML Model settings
    MODEL_PATH: str = ""  # Path to exported Keras model (.h5 or SavedModel dir)
    MODEL_TYPE: str = "SALIENT"  # SALIENT | CNN_LSTM | Transformer
    MODEL_LOAD_MODE: str = "lazy"  # lazy | background | sync
    SCALER_PATH: str = ""  # Path to exported StandardScaler (.pkl)
    MODEL_METADATA_PATH: str = ""  # Path to model_metadata.json
    PREDICTION_CACHE_PATH: str = "app/generated/prediction_cache.py"

    # fNIRS preprocessing settings
    WINDOW_SIZE: int = 150  # Timesteps per window (30 sec at 5 Hz)
    WINDOW_STRIDE: int = 3  # Sliding window stride in timesteps
    N_CLASSES: int = 4  # Number of workload classes (0-back, 1-back, 2-back, 3-back)
    FNIRS_FEATURES: str = "AB_I_O,AB_PHI_O,AB_I_DO,AB_PHI_DO,CD_I_O,CD_PHI_O,CD_I_DO,CD_PHI_DO"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def fnirs_feature_list(self) -> list[str]:
        return [f.strip() for f in self.FNIRS_FEATURES.split(",")]

    @property
    def frontend_oauth_callback_url(self) -> str:
        return f"{self.FRONTEND_URL.rstrip('/')}/oauth/callback"

    def _normalize_asyncpg_url(self, database_url: str) -> tuple[str, dict]:
        connect_args: dict = {}

        if not database_url.startswith("postgresql+asyncpg://"):
            return database_url, connect_args

        parsed = urlsplit(database_url)
        query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
        filtered_pairs = []

        for key, value in query_pairs:
            if key == "sslmode":
                # SQLAlchemy's asyncpg dialect forwards unknown query params as
                # keyword args, but asyncpg expects SSL policy via "ssl".
                connect_args["ssl"] = value
                continue
            filtered_pairs.append((key, value))

        normalized_url = urlunsplit(
            parsed._replace(query=urlencode(filtered_pairs, doseq=True))
        )
        return normalized_url, connect_args

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            normalized_url, _ = self._normalize_asyncpg_url(self.DATABASE_URL)
            return normalized_url

        user = quote_plus(self.POSTGRES_USER)
        password = quote_plus(self.POSTGRES_PASSWORD)
        host = self.POSTGRES_HOST.strip()
        database = self.POSTGRES_DB.strip()

        database_url = (
            f"postgresql+asyncpg://{user}:{password}"
            f"@{host}:{self.POSTGRES_PORT}/{database}"
        )
        normalized_url, _ = self._normalize_asyncpg_url(database_url)
        return normalized_url

    @property
    def database_connect_args(self) -> dict:
        if self.DATABASE_URL:
            _, connect_args = self._normalize_asyncpg_url(self.DATABASE_URL)
            return connect_args

        return {}

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
