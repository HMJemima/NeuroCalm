from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from app.utils.fnirs_experimental_pipeline import convert_raw_input_to_continuous_features


FNIRSOFT_HEADER = ["fnirSoft:", "Exported CSV File"]


@dataclass
class InputInspection:
    path: str
    kind: str
    compatible: bool
    reason: str
    details: dict

    def to_dict(self) -> dict:
        return asdict(self)


def _read_csv_preview(path: Path, max_rows: int = 20) -> list[list[str]]:
    with path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f)
        return [row for _, row in zip(range(max_rows), reader)]


def inspect_input_file(path: str | Path, expected_cols: list[str]) -> InputInspection:
    file_path = Path(path)
    suffix = file_path.suffix.lower()

    if suffix == ".csv":
        return inspect_csv_file(file_path, expected_cols)

    if suffix == ".nir":
        return InputInspection(
            path=str(file_path),
            kind="raw_light_device_export",
            compatible=False,
            reason=(
                "Raw .nir export detected. It is not directly model-ready, but the backend can "
                "now build an experimental Tufts-style 8-feature signal from this file before "
                "windowing and prediction."
            ),
            details={"required_features": expected_cols, "experimental_pipeline": True},
        )

    if suffix == ".oxy":
        return InputInspection(
            path=str(file_path),
            kind="raw_hemoglobin_device_export",
            compatible=False,
            reason=(
                "Raw .oxy export detected. It is not directly model-ready, but the backend can "
                "now build an experimental Tufts-style 8-feature signal from this file before "
                "windowing and prediction."
            ),
            details={"required_features": expected_cols, "experimental_pipeline": True},
        )

    if suffix in {".log", ".mrk"}:
        return InputInspection(
            path=str(file_path),
            kind="supplementary_metadata",
            compatible=False,
            reason="Marker/log file detected. This is metadata, not model input.",
            details={},
        )

    return InputInspection(
        path=str(file_path),
        kind="unsupported",
        compatible=False,
        reason=f"Unsupported input extension: {suffix or '<none>'}",
        details={},
    )


def inspect_csv_file(path: str | Path, expected_cols: list[str]) -> InputInspection:
    file_path = Path(path)
    rows = _read_csv_preview(file_path)

    for row in rows:
        normalized = [cell.strip() for cell in row]
        if all(col in normalized for col in expected_cols):
            return InputInspection(
                path=str(file_path),
                kind="model_ready_csv",
                compatible=True,
                reason="CSV contains all required model feature columns.",
                details={"required_features": expected_cols},
            )

    if rows and rows[0][:2] == FNIRSOFT_HEADER:
        dims = next((row[1] for row in rows if row and row[0] == "Size:" and len(row) > 1), "unknown")
        content = next((row[1] for row in rows if row and row[0] == "Content:" and len(row) > 1), "unknown")
        return InputInspection(
            path=str(file_path),
            kind="fnirsoft_export",
            compatible=False,
            reason=(
                "Raw fnirSoft export detected. It is not directly model-ready, but the backend can "
                "now build an experimental Tufts-style 8-feature signal from this export before "
                "windowing and prediction."
            ),
            details={
                "size": dims,
                "content": content,
                "required_features": expected_cols,
                "experimental_pipeline": True,
            },
        )

    return InputInspection(
        path=str(file_path),
        kind="other_csv",
        compatible=False,
        reason=(
            "CSV is missing the required model feature columns. "
            "Provide a CSV with AB_I_O, AB_PHI_O, AB_I_DO, AB_PHI_DO, "
            "CD_I_O, CD_PHI_O, CD_I_DO, and CD_PHI_DO."
        ),
        details={"required_features": expected_cols},
    )


def load_model_ready_csv(path: str | Path, expected_cols: list[str]) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = [col for col in expected_cols if col not in df.columns]
    if missing:
        raise ValueError(
            "CSV is missing required model columns: "
            + ", ".join(missing)
        )

    data = df[expected_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    return data


def window_continuous_dataframe(
    df: pd.DataFrame,
    expected_cols: list[str],
    window_size: int,
    stride: int,
) -> pd.DataFrame:
    values = df[expected_cols].to_numpy(dtype=np.float32, copy=True)

    if len(values) == 0:
        raise ValueError("Input CSV has no rows.")

    if len(values) < window_size:
        values = np.pad(values, ((0, window_size - len(values)), (0, 0)), mode="edge")
        starts = [0]
    else:
        starts = list(range(0, len(values) - window_size + 1, stride))

    frames = []
    for chunk_id, start in enumerate(starts):
        window = values[start: start + window_size]
        chunk_df = pd.DataFrame(window, columns=expected_cols)
        chunk_df.insert(0, "chunk", chunk_id)
        frames.append(chunk_df)

    return pd.concat(frames, ignore_index=True)


def normalize_chunked_dataframe(
    df: pd.DataFrame,
    expected_cols: list[str],
    window_size: int,
) -> pd.DataFrame:
    if "chunk" not in df.columns:
        raise ValueError("Chunked normalization requires a 'chunk' column.")

    frames = []
    for new_chunk_id, (_, chunk_df) in enumerate(df.groupby("chunk", sort=False)):
        values = chunk_df[expected_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0).to_numpy(dtype=np.float32)
        if len(values) < window_size:
            values = np.pad(values, ((0, window_size - len(values)), (0, 0)), mode="edge")
        else:
            values = values[:window_size]

        normalized = pd.DataFrame(values, columns=expected_cols)
        normalized.insert(0, "chunk", new_chunk_id)

        if "label" in chunk_df.columns:
            normalized["label"] = chunk_df["label"].iloc[0]

        frames.append(normalized)

    return pd.concat(frames, ignore_index=True)


def preprocess_model_ready_csv(
    path: str | Path,
    expected_cols: list[str],
    window_size: int,
    stride: int,
) -> pd.DataFrame:
    df = pd.read_csv(path)
    missing = [col for col in expected_cols if col not in df.columns]
    if missing:
        raise ValueError(
            "CSV is missing required model columns: "
            + ", ".join(missing)
        )

    if "chunk" in df.columns:
        return normalize_chunked_dataframe(df, expected_cols, window_size)

    continuous = df[expected_cols].apply(pd.to_numeric, errors="coerce").fillna(0.0)
    return window_continuous_dataframe(continuous, expected_cols, window_size, stride)


def preprocess_supported_input(
    path: str | Path,
    expected_cols: list[str],
    window_size: int,
    stride: int,
) -> pd.DataFrame:
    file_path = Path(path)
    suffix = file_path.suffix.lower()

    if suffix == ".csv":
        inspection = inspect_input_file(file_path, expected_cols)
        if inspection.compatible:
            return preprocess_model_ready_csv(file_path, expected_cols, window_size, stride)

        if inspection.kind == "fnirsoft_export":
            continuous = convert_raw_input_to_continuous_features(
                file_path,
                expected_cols=expected_cols,
                target_hz=window_size / 30.0,
            )
            return window_continuous_dataframe(continuous, expected_cols, window_size, stride)

        raise ValueError(inspection.reason)

    if suffix in {".nir", ".oxy"}:
        continuous = convert_raw_input_to_continuous_features(
            file_path,
            expected_cols=expected_cols,
            target_hz=window_size / 30.0,
        )
        return window_continuous_dataframe(continuous, expected_cols, window_size, stride)

    raise ValueError(f"Unsupported input extension: {suffix or '<none>'}")


def chunked_dataframe_to_windows(
    df: pd.DataFrame,
    expected_cols: list[str],
    window_size: int,
) -> np.ndarray:
    if "chunk" not in df.columns:
        raise ValueError("Chunked input requires a 'chunk' column.")

    windows: list[np.ndarray] = []
    for chunk_id, chunk_df in df.groupby("chunk", sort=False):
        values = (
            chunk_df[expected_cols]
            .apply(pd.to_numeric, errors="coerce")
            .fillna(0.0)
            .to_numpy(dtype=np.float32)
        )

        if len(values) != window_size:
            raise ValueError(
                f"Chunk {chunk_id} has {len(values)} rows; expected {window_size}."
            )

        windows.append(values)

    if not windows:
        raise ValueError("No windows were produced from the input CSV.")

    return np.stack(windows, axis=0)


def discover_candidate_files(root: str | Path, expected_cols: list[str]) -> list[Path]:
    root_path = Path(root)
    if root_path.is_file():
        return [root_path]

    candidates: list[Path] = []
    for path in sorted(root_path.rglob("*")):
        if not path.is_file():
            continue

        suffix = path.suffix.lower()
        name = path.name.lower()

        if suffix in {".nir", ".oxy"}:
            candidates.append(path)
            continue

        if suffix != ".csv":
            continue

        if ".block" in name:
            candidates.append(path)
            continue

        preview = _read_csv_preview(path, max_rows=2)
        first_row = preview[0] if preview else []
        if all(col in [cell.strip() for cell in first_row] for col in expected_cols):
            candidates.append(path)

    return candidates


def write_report(report_path: str | Path, inspections: list[InputInspection | dict]) -> None:
    payload = [
        item.to_dict() if isinstance(item, InputInspection) else item
        for item in inspections
    ]
    path = Path(report_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
