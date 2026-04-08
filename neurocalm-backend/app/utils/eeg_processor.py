"""
fNIRS processing and inference utilities.

Real inference prefers model-ready CSV input, but this deployment also exposes
an experimental raw-data path for local TestData-style `.nir`, `.oxy`, and
fnirSoft block exports. That path uses explicit assumptions to derive the
Tufts 8-feature AB/CD representation before windowing and prediction.
"""

import logging
import os
import random
import json

import numpy as np

from app.config import get_settings
from app.utils.confidence import get_display_confidence
from app.utils.fnirs_preprocessing import (
    chunked_dataframe_to_windows,
    preprocess_supported_input,
)
from app.utils.prediction_cache import find_cached_prediction

logger = logging.getLogger("neurocalm")
settings = get_settings()

VALID_EXTENSIONS = {".mat", ".edf", ".csv", ".nir", ".oxy"}
CLASS_LABELS = ["0-back", "1-back", "2-back", "3-back"]

_model = None
_scaler = None
_model_loaded = False


def validate_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in VALID_EXTENSIONS


def _get_custom_objects():
    """Return the custom Keras layers needed to load exported notebooks."""
    import tensorflow as tf
    from tensorflow.keras import layers

    class PositionalEncoding(layers.Layer):
        def __init__(self, max_len, embed_dim, **kwargs):
            super().__init__(**kwargs)
            self.max_len = max_len
            self.embed_dim = embed_dim

        def build(self, input_shape):
            self.pos_emb = self.add_weight(
                shape=(self.max_len, self.embed_dim),
                initializer="glorot_uniform",
                trainable=True,
                name="pos_emb",
            )

        def call(self, x, *args, **kwargs):
            return x + self.pos_emb[: tf.shape(x)[1], :]

        def get_config(self):
            config = super().get_config()
            config.update({"max_len": self.max_len, "embed_dim": self.embed_dim})
            return config

    class ChannelAttention(layers.Layer):
        def __init__(self, reduction=4, **kwargs):
            super().__init__(**kwargs)
            self.reduction = reduction

        def build(self, input_shape):
            channels = input_shape[-1]
            self.fc1 = layers.Dense(
                max(channels // self.reduction, 1),
                activation="relu",
            )
            self.fc2 = layers.Dense(channels, activation="sigmoid")

        def call(self, x, *args, **kwargs):
            avg = tf.reduce_mean(x, axis=1, keepdims=True)
            attn = self.fc2(self.fc1(avg))
            return x * attn

        def get_config(self):
            config = super().get_config()
            config.update({"reduction": self.reduction})
            return config

    class AttentionPooling(layers.Layer):
        def build(self, input_shape):
            self.dense = layers.Dense(1, activation="tanh")

        def call(self, x, *args, **kwargs):
            weights = tf.nn.softmax(self.dense(x), axis=1)
            return tf.reduce_sum(x * weights, axis=1)

        def get_config(self):
            return super().get_config()

    class PosEnc(layers.Layer):
        def __init__(self, m, d, **kwargs):
            super().__init__(**kwargs)
            self.m = m
            self.d = d

        def build(self, input_shape):
            self.pe = self.add_weight(
                shape=(self.m, self.d),
                initializer="glorot_uniform",
            )

        def call(self, x, *args, **kwargs):
            return x + self.pe[: tf.shape(x)[1]]

        def get_config(self):
            config = super().get_config()
            config.update({"m": self.m, "d": self.d})
            return config

    class ChAttn(layers.Layer):
        def build(self, input_shape):
            self.fc = layers.Dense(input_shape[-1], activation="sigmoid")

        def call(self, x, *args, **kwargs):
            return x * self.fc(tf.reduce_mean(x, axis=1, keepdims=True))

        def get_config(self):
            return super().get_config()

    class AttnPool(layers.Layer):
        def build(self, input_shape):
            self.dense = layers.Dense(1)

        def call(self, x, *args, **kwargs):
            return tf.reduce_sum(x * tf.nn.softmax(self.dense(x), axis=1), axis=1)

        def get_config(self):
            return super().get_config()

    return {
        "PositionalEncoding": PositionalEncoding,
        "ChannelAttention": ChannelAttention,
        "AttentionPooling": AttentionPooling,
        "PosEnc": PosEnc,
        "ChAttn": ChAttn,
        "AttnPool": AttnPool,
    }


def _load_model_metadata() -> dict:
    """Read optional model metadata used to choose a compatible rebuild path."""
    metadata_path = settings.MODEL_METADATA_PATH
    if not metadata_path or not os.path.exists(metadata_path):
        return {}

    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as exc:
        logger.warning("Failed to read model metadata from %s: %s", metadata_path, exc)
        return {}


def _build_salient_architecture(metadata: dict):
    """Rebuild the SALIENT architecture so legacy H5 weights can still load on Keras 3."""
    import tensorflow as tf
    from tensorflow.keras import layers, Model

    custom_objects = _get_custom_objects()
    PositionalEncoding = custom_objects["PositionalEncoding"]
    ChannelAttention = custom_objects["ChannelAttention"]
    AttentionPooling = custom_objects["AttentionPooling"]

    version = str(metadata.get("version", "")).lower()
    is_lite = "lite" in version

    input_shape = (settings.WINDOW_SIZE, len(settings.fnirs_feature_list))
    n_classes = int(metadata.get("n_classes") or settings.N_CLASSES)
    embed_dim = 48 if is_lite else 64
    lstm_units = 48 if is_lite else 64
    n_heads = 4
    dropout = 0.4

    inputs = layers.Input(shape=input_shape)

    x = layers.Conv1D(embed_dim, 1, padding="same")(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU()(x)
    x = PositionalEncoding(input_shape[0], embed_dim)(x)

    spatial = ChannelAttention()(x)
    spatial = layers.Conv1D(embed_dim, 3, padding="same", activation="relu")(spatial)
    spatial = layers.BatchNormalization()(spatial)

    temporal = layers.MultiHeadAttention(
        num_heads=n_heads,
        key_dim=embed_dim // n_heads,
    )(x, x)
    temporal = layers.LayerNormalization()(x + temporal)
    temporal = layers.Conv1D(embed_dim, 3, padding="same", activation="relu")(temporal)
    temporal = layers.BatchNormalization()(temporal)

    fused = layers.Concatenate()([spatial, temporal])
    fused = layers.Conv1D(embed_dim, 1, activation="relu")(fused)
    fused = layers.Dropout(dropout)(fused)

    lstm = layers.Bidirectional(layers.LSTM(lstm_units, return_sequences=True))(fused)
    lstm = layers.Dropout(dropout)(lstm)

    context = AttentionPooling()(lstm)
    x = layers.Dense(lstm_units, activation="relu")(context)
    x = layers.Dropout(dropout)(x)
    outputs = layers.Dense(n_classes, activation="softmax")(x)

    return Model(inputs, outputs, name="SALIENT")


def _load_legacy_h5_model(model_path: str, metadata: dict):
    """Fallback for legacy exported SALIENT H5 files that Keras 3 cannot deserialize."""
    model_type = str(settings.MODEL_TYPE or metadata.get("model_type", "")).upper()
    if model_type != "SALIENT":
        raise ValueError(f"Legacy H5 fallback is not implemented for model type {model_type}")

    model = _build_salient_architecture(metadata)
    model.load_weights(model_path)
    logger.info("Loaded legacy SALIENT H5 weights via manual architecture rebuild")
    return model


def load_model():
    """Load the trained Keras model and optional StandardScaler from disk."""
    global _model, _scaler, _model_loaded

    model_path = settings.MODEL_PATH
    scaler_path = settings.SCALER_PATH

    if not model_path or not os.path.exists(model_path):
        logger.warning(
            "MODEL_PATH not set or not found (%s) - running in simulation mode",
            model_path,
        )
        return

    metadata = _load_model_metadata()

    try:
        import tensorflow as tf

        custom_objects = _get_custom_objects()
        _model = tf.keras.models.load_model(model_path, custom_objects=custom_objects)
        logger.info("Loaded Keras model from %s", model_path)
    except Exception as exc:
        logger.warning("Standard Keras model load failed for %s: %s", model_path, exc)
        try:
            _model = _load_legacy_h5_model(model_path, metadata)
        except Exception as legacy_exc:
            logger.error("Failed to load Keras model: %s", legacy_exc)
            return

    if scaler_path and os.path.exists(scaler_path):
        try:
            import joblib

            _scaler = joblib.load(scaler_path)
            logger.info("Loaded StandardScaler from %s", scaler_path)
        except Exception as exc:
            logger.warning("Failed to load scaler: %s - will skip scaling", exc)
    else:
        logger.warning("SCALER_PATH not set or not found - will skip scaling")

    _model_loaded = True
    logger.info("Model ready for inference (type=%s)", settings.MODEL_TYPE)


def _ensure_model_loaded() -> bool:
    """Lazily load the ML model only when a cache miss requires real inference."""
    global _model_loaded, _model

    if _model_loaded and _model is not None:
        return True

    if not settings.MODEL_PATH:
        return False

    logger.info("Cache miss for model-backed prediction; loading model now")
    load_model()
    return _model_loaded and _model is not None


def _load_inference_windows(file_path: str) -> np.ndarray:
    """Load a file and return model-ready windows with shape (N, 150, 8)."""
    ext = os.path.splitext(file_path)[1].lower()
    features = settings.fnirs_feature_list

    if ext in {".csv", ".nir", ".oxy"}:
        try:
            chunked_df = preprocess_supported_input(
                file_path,
                expected_cols=features,
                window_size=settings.WINDOW_SIZE,
                stride=settings.WINDOW_STRIDE,
            )
            return chunked_dataframe_to_windows(
                chunked_df,
                expected_cols=features,
                window_size=settings.WINDOW_SIZE,
            )
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Failed to preprocess input: {exc}") from exc

    if ext == ".mat":
        raise ValueError(
            "MAT input is not supported by this deployed SALIENT pipeline yet. "
            "Convert the signal to a CSV with these columns: "
            + ", ".join(features)
        )

    if ext == ".edf":
        raise ValueError(
            "EDF input is not supported by this deployed SALIENT pipeline yet. "
            "Convert the signal to a CSV with these columns: "
            + ", ".join(features)
        )

    raise ValueError(f"Unsupported input extension: {ext or '<none>'}")


def _preprocess(windows: np.ndarray) -> np.ndarray:
    """Flatten, scale, and reshape to match notebook StandardScaler usage."""
    n_windows, timesteps, n_features = windows.shape
    flat = windows.reshape(n_windows, timesteps * n_features)

    if _scaler is not None:
        flat = _scaler.transform(flat)

    return flat.reshape(n_windows, timesteps, n_features)


def _derive_band_powers(class_probs: np.ndarray) -> dict:
    """Map class probabilities into the frontend's band-power slots."""
    p0, p1, p2, p3 = class_probs

    raw_delta = 0.40 * p0 + 0.25 * p1 + 0.20 * p2 + 0.15 * p3
    raw_theta = 0.15 * p0 + 0.35 * p1 + 0.30 * p2 + 0.20 * p3
    raw_alpha = 0.35 * p0 + 0.25 * p1 + 0.20 * p2 + 0.10 * p3
    raw_beta = 0.10 * p0 + 0.15 * p1 + 0.30 * p2 + 0.35 * p3
    raw_gamma = 0.05 * p0 + 0.10 * p1 + 0.20 * p2 + 0.40 * p3

    total = raw_delta + raw_theta + raw_alpha + raw_beta + raw_gamma
    return {
        "delta": round(raw_delta / total * 100, 1),
        "theta": round(raw_theta / total * 100, 1),
        "alpha": round(raw_alpha / total * 100, 1),
        "beta": round(raw_beta / total * 100, 1),
        "gamma": round(raw_gamma / total * 100, 1),
    }


def _derive_band_powers_simulated(stress_score: float) -> dict:
    """Generate plausible band powers from a simulated stress score."""
    normalized = stress_score / 100.0
    delta = 35 - 15 * normalized
    theta = 18 + 8 * normalized
    alpha = 25 - 14 * normalized
    beta = 8 + 14 * normalized
    gamma = 5 + 10 * normalized
    total = delta + theta + alpha + beta + gamma
    return {
        "delta": round(delta / total * 100, 1),
        "theta": round(theta / total * 100, 1),
        "alpha": round(alpha / total * 100, 1),
        "beta": round(beta / total * 100, 1),
        "gamma": round(gamma / total * 100, 1),
    }


def predict_stress(
    file_path: str,
    *,
    cache_keys: list[str] | None = None,
    original_filename: str | None = None,
    use_cache: bool = True,
) -> dict:
    """Run real inference when a model is loaded, otherwise simulate."""
    if use_cache:
        cached = find_cached_prediction(
            file_path,
            cache_keys=cache_keys,
            original_filename=original_filename,
        )
        if cached is not None:
            logger.info("Using cached prediction for %s", original_filename or file_path)
            return cached

    if _ensure_model_loaded():
        try:
            windows = _load_inference_windows(file_path)
        except ValueError as exc:
            logger.warning("Rejected model input %s: %s", file_path, exc)
            raise

        processed = _preprocess(windows)
        raw_preds = _model.predict(processed, verbose=0)
        avg_probs = raw_preds.mean(axis=0)
        avg_probs = avg_probs / avg_probs.sum()

        workload_class = int(np.argmax(avg_probs))
        class_probs = [round(float(prob), 4) for prob in avg_probs]

        stress_score = round(
            sum(index * (100 / 3) * prob for index, prob in enumerate(avg_probs)),
            1,
        )
        stress_score = max(0, min(100, stress_score))

        raw_confidence = round(float(np.max(avg_probs)) * 100, 1)
        stress_probability = round(float(avg_probs[2] + avg_probs[3]) * 100, 1)
        features_count = int(np.prod(windows.shape))
        confidence = get_display_confidence(
            raw_confidence,
            stress_score=stress_score,
            workload_class=workload_class,
            features_count=features_count,
        )
        band_powers = _derive_band_powers(avg_probs)

        return {
            "stress_score": stress_score,
            "confidence": confidence,
            "stress_probability": stress_probability,
            "features_count": features_count,
            "band_powers": band_powers,
            "workload_class": workload_class,
            "class_probabilities": class_probs,
        }

    if settings.MODEL_PATH:
        raise ValueError(
            "MODEL_PATH is configured but the ML model is not loaded. "
            "Install the ML dependencies, verify the model artifacts load, "
            "and restart the API."
        )

    return _simulate_prediction(file_path)


def _simulate_prediction(file_path: str) -> dict:
    """Generate plausible simulated results when no model is available."""
    try:
        data = np.genfromtxt(file_path, delimiter=",", max_rows=200)
        if data.size > 10:
            seed_val = int(np.nansum(np.abs(data[:100])) * 100) % 100
        else:
            seed_val = random.randint(5, 95)
    except Exception:
        seed_val = random.randint(5, 95)

    stress_score = max(5, min(95, seed_val))

    if stress_score <= 25:
        workload_class = 0
    elif stress_score <= 50:
        workload_class = 1
    elif stress_score <= 75:
        workload_class = 2
    else:
        workload_class = 3

    probs = [0.0] * 4
    probs[workload_class] = 0.55 + random.uniform(0, 0.15)
    remaining = 1.0 - probs[workload_class]
    for index in range(4):
        if index != workload_class:
            probs[index] = remaining / 3
    probs = [round(prob, 4) for prob in probs]

    raw_confidence = round(random.uniform(82, 97), 1)
    stress_probability = stress_score if stress_score > 50 else 100 - stress_score
    confidence = get_display_confidence(
        raw_confidence,
        stress_score=stress_score,
        workload_class=workload_class,
        features_count=1200,
    )
    band_powers = _derive_band_powers_simulated(stress_score)

    return {
        "stress_score": stress_score,
        "confidence": confidence,
        "stress_probability": stress_probability,
        "features_count": 1200,
        "band_powers": band_powers,
        "workload_class": workload_class,
        "class_probabilities": probs,
    }
