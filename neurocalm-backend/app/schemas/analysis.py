from datetime import datetime
from pydantic import BaseModel


class BandPowers(BaseModel):
    delta: float
    theta: float
    alpha: float
    beta: float
    gamma: float


class AnalysisOut(BaseModel):
    id: str
    filename: str
    stress_score: float
    confidence: float
    stress_probability: float
    features_count: int
    band_powers: dict
    workload_class: int
    class_probabilities: list[float]
    created_at: datetime
    user_name: str
    user_email: str

    class Config:
        from_attributes = True


class AnalysisHistoryItem(BaseModel):
    id: str
    filename: str
    stress_score: float
    confidence: float
    workload_class: int
    class_probabilities: list[float]
    created_at: datetime
    user_name: str
    user_email: str

    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    items: list[AnalysisHistoryItem]
    total: int
    page: int
    page_size: int


class ReportOut(BaseModel):
    id: str
    title: str
    description: str
    type: str
    date: str
    analyses_count: int
    avg_score: float
    trend: str
    status: str
    generated_by: str


class AdminStats(BaseModel):
    total_users: str
    total_analyses: str
    avg_processing_time: str
    model_accuracy: str


class BatchPredictionCacheRequest(BaseModel):
    source_dir: str
    output_py: str | None = None
    extensions: list[str] = [".csv", ".nir", ".oxy"]
    merge_existing: bool = True


class BatchPredictionCacheItem(BaseModel):
    source_path: str
    cache_keys: list[str]
    status: str
    result: dict | None = None
    error: str | None = None


class BatchPredictionCacheResponse(BaseModel):
    source_dir: str
    output_py: str
    total_files: int
    cached_count: int
    failed_count: int
    items: list[BatchPredictionCacheItem]


class ModelInfoOut(BaseModel):
    model_type: str
    version: str
    accuracy: str
    features: str
    training_data: str
    last_updated: str
    f1_score: str | None = None
    kappa: str | None = None
    timesteps: int | None = None
    n_channels: int | None = None
    n_classes: int | None = None
    feature_cols: list[str] = []
    evaluation_timestamp: str | None = None
    evaluation_subjects: list[dict] = []
