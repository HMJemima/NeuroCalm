from __future__ import annotations

import csv
import math
import re
from pathlib import Path

import numpy as np
import pandas as pd


OPTODES_PER_REGION = 8
OPTODES_PER_SUBGROUP = 4
FNIRSOFT_DATA_SECTION = "VariableData"
FNIRSOFT_HEADER = ["fnirSoft:", "Exported CSV File"]
DEFAULT_SESSION_SECONDS = 30.0


def convert_raw_input_to_continuous_features(
    path: str | Path,
    expected_cols: list[str],
    target_hz: float,
) -> pd.DataFrame:
    """
    Build an experimental Tufts-style 8-feature continuous dataframe from raw exports.

    Assumptions:
    - Optodes 1..8 approximate the AB region and optodes 9..16 approximate the CD region.
    - HbO/HbR signals drive the oxy/deoxy intensity features when available.
    - Raw light dynamics provide phase-like proxies when available.
    - If only one modality is available, missing components are derived from sign-inverted or
      subgroup-difference proxies so the downstream model can still receive shape-compatible input.
    """
    raw_path = Path(path)
    suffix = raw_path.suffix.lower()

    if suffix == ".csv":
        continuous = _convert_fnirsoft_csv(raw_path, target_hz)
    elif suffix == ".oxy":
        continuous = _convert_raw_oxy_device_export(raw_path, target_hz)
    elif suffix == ".nir":
        continuous = _convert_raw_nir_device_export(raw_path, target_hz)
    else:
        raise ValueError(f"Unsupported raw input extension: {suffix or '<none>'}")

    missing = [col for col in expected_cols if col not in continuous.columns]
    if missing:
        raise ValueError(
            "Experimental preprocessing failed to build all required model columns: "
            + ", ".join(missing)
        )

    return continuous[expected_cols]


def _convert_fnirsoft_csv(path: Path, target_hz: float) -> pd.DataFrame:
    df, metadata = _read_fnirsoft_export(path)
    kind = _classify_fnirsoft_dataframe(path, df, metadata)

    if kind == "marker":
        raise ValueError("Marker CSV does not contain signal data.")

    if kind == "time":
        raise ValueError("Time CSV does not contain signal data.")

    if kind in {"hbo", "hbr", "oxy"}:
        hbo_df = df if kind == "hbo" else _read_optional_fnirsoft_sibling(path, "hbo")
        hbr_df = df if kind == "hbr" else _read_optional_fnirsoft_sibling(path, "hbr")
        oxy_df = df if kind == "oxy" else _read_optional_fnirsoft_sibling(path, "oxy")
        time_df = _read_optional_time_sibling(path)
        marker_df = _read_optional_marker_sibling(path)

        base_oxy_df = hbo_df if hbo_df is not None else oxy_df if oxy_df is not None else df
        oxy_matrix = _optode_dataframe_to_matrix(base_oxy_df)
        deoxy_matrix = _optode_dataframe_to_matrix(hbr_df) if hbr_df is not None else None
        if deoxy_matrix is None:
            deoxy_matrix = -oxy_matrix

        time_values = _coerce_time_values(time_df, rows=len(oxy_matrix))
        marker_df = _normalize_marker_df(marker_df)

        return _build_feature_dataframe(
            time_values=time_values,
            oxy_matrix=oxy_matrix,
            deoxy_matrix=deoxy_matrix,
            phase_oxy_matrix=None,
            phase_deoxy_matrix=None,
            marker_df=marker_df,
            target_hz=target_hz,
        )

    if kind == "raw":
        time_df = _read_optional_time_sibling(path)
        marker_df = _read_optional_marker_sibling(path)
        time_values = _coerce_time_values(time_df, rows=len(df))
        marker_df = _normalize_marker_df(marker_df)
        corrected_730, corrected_850 = _fnirsoft_raw_light_to_matrices(df)
        return _build_feature_dataframe(
            time_values=time_values,
            oxy_matrix=None,
            deoxy_matrix=None,
            phase_oxy_matrix=None,
            phase_deoxy_matrix=None,
            light_730_matrix=corrected_730,
            light_850_matrix=corrected_850,
            marker_df=marker_df,
            target_hz=target_hz,
        )

    raise ValueError(
        "Unsupported fnirSoft CSV structure. Upload a model-ready CSV, a raw .oxy/.nir file, "
        "or a fnirSoft hbo/hbr/oxy/raw block export."
    )


def _convert_raw_oxy_device_export(path: Path, target_hz: float) -> pd.DataFrame:
    time_values, oxy_matrix, deoxy_matrix = _read_raw_oxy_device_export(path)
    return _build_feature_dataframe(
        time_values=time_values,
        oxy_matrix=oxy_matrix,
        deoxy_matrix=deoxy_matrix,
        phase_oxy_matrix=None,
        phase_deoxy_matrix=None,
        marker_df=None,
        target_hz=target_hz,
    )


def _convert_raw_nir_device_export(path: Path, target_hz: float) -> pd.DataFrame:
    time_values, corrected_730, corrected_850 = _read_raw_nir_device_export(path)
    return _build_feature_dataframe(
        time_values=time_values,
        oxy_matrix=None,
        deoxy_matrix=None,
        phase_oxy_matrix=None,
        phase_deoxy_matrix=None,
        light_730_matrix=corrected_730,
        light_850_matrix=corrected_850,
        marker_df=None,
        target_hz=target_hz,
    )


def _build_feature_dataframe(
    *,
    time_values: np.ndarray | None,
    oxy_matrix: np.ndarray | None,
    deoxy_matrix: np.ndarray | None,
    phase_oxy_matrix: np.ndarray | None,
    phase_deoxy_matrix: np.ndarray | None,
    light_730_matrix: np.ndarray | None = None,
    light_850_matrix: np.ndarray | None = None,
    marker_df: pd.DataFrame | None,
    target_hz: float,
) -> pd.DataFrame:
    if oxy_matrix is None and deoxy_matrix is None and light_730_matrix is None and light_850_matrix is None:
        raise ValueError("No usable raw signal channels were found.")

    rows = _first_available_rows(oxy_matrix, deoxy_matrix, light_730_matrix, light_850_matrix)
    time_values = _ensure_time_values(time_values, rows=rows, target_hz=target_hz)

    if light_730_matrix is not None and light_850_matrix is not None:
        corrected_730 = np.maximum(light_730_matrix, 1.0)
        corrected_850 = np.maximum(light_850_matrix, 1.0)
        oxy_from_light = np.log1p(corrected_850) - np.log1p(corrected_730)
        deoxy_from_light = np.log1p(corrected_730) - np.log1p(corrected_850)
        if oxy_matrix is None:
            oxy_matrix = oxy_from_light
        if deoxy_matrix is None:
            deoxy_matrix = deoxy_from_light
        if phase_oxy_matrix is None:
            phase_oxy_matrix = np.gradient(np.log1p(corrected_850), axis=0)
        if phase_deoxy_matrix is None:
            phase_deoxy_matrix = np.gradient(np.log1p(corrected_730), axis=0)

    if oxy_matrix is None and deoxy_matrix is not None:
        oxy_matrix = -deoxy_matrix
    if deoxy_matrix is None and oxy_matrix is not None:
        deoxy_matrix = -oxy_matrix

    if phase_oxy_matrix is None and oxy_matrix is not None:
        phase_oxy_matrix = np.gradient(oxy_matrix, axis=0)
    if phase_deoxy_matrix is None and deoxy_matrix is not None:
        phase_deoxy_matrix = np.gradient(deoxy_matrix, axis=0)

    common_time = _build_common_time_grid(
        time_values=time_values,
        marker_df=marker_df,
        target_hz=target_hz,
    )

    oxy_matrix = _resample_matrix(time_values, oxy_matrix, common_time)
    deoxy_matrix = _resample_matrix(time_values, deoxy_matrix, common_time)
    phase_oxy_matrix = _resample_matrix(time_values, phase_oxy_matrix, common_time)
    phase_deoxy_matrix = _resample_matrix(time_values, phase_deoxy_matrix, common_time)

    feature_df = _derive_regional_features(
        oxy_matrix=oxy_matrix,
        deoxy_matrix=deoxy_matrix,
        phase_oxy_matrix=phase_oxy_matrix,
        phase_deoxy_matrix=phase_deoxy_matrix,
    )
    feature_df = _normalize_feature_frame(feature_df)
    feature_df.insert(0, "time", common_time)
    return feature_df


def _derive_regional_features(
    *,
    oxy_matrix: np.ndarray,
    deoxy_matrix: np.ndarray,
    phase_oxy_matrix: np.ndarray,
    phase_deoxy_matrix: np.ndarray,
) -> pd.DataFrame:
    oxy_matrix = _ensure_optode_shape(oxy_matrix)
    deoxy_matrix = _ensure_optode_shape(deoxy_matrix)
    phase_oxy_matrix = _ensure_optode_shape(phase_oxy_matrix)
    phase_deoxy_matrix = _ensure_optode_shape(phase_deoxy_matrix)

    ab_slice = slice(0, OPTODES_PER_REGION)
    cd_slice = slice(OPTODES_PER_REGION, OPTODES_PER_REGION * 2)

    data = {
        "AB_I_O": oxy_matrix[:, ab_slice].mean(axis=1),
        "AB_PHI_O": _phase_proxy(phase_oxy_matrix[:, ab_slice]),
        "AB_I_DO": deoxy_matrix[:, ab_slice].mean(axis=1),
        "AB_PHI_DO": _phase_proxy(phase_deoxy_matrix[:, ab_slice]),
        "CD_I_O": oxy_matrix[:, cd_slice].mean(axis=1),
        "CD_PHI_O": _phase_proxy(phase_oxy_matrix[:, cd_slice]),
        "CD_I_DO": deoxy_matrix[:, cd_slice].mean(axis=1),
        "CD_PHI_DO": _phase_proxy(phase_deoxy_matrix[:, cd_slice]),
    }
    return pd.DataFrame(data)


def _phase_proxy(region_matrix: np.ndarray) -> np.ndarray:
    left = region_matrix[:, :OPTODES_PER_SUBGROUP].mean(axis=1)
    right = region_matrix[:, OPTODES_PER_SUBGROUP:].mean(axis=1)
    return left - right


def _normalize_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    normalized: dict[str, np.ndarray] = {}
    for col in df.columns:
        series = pd.Series(df[col], dtype="float64")
        short = series.rolling(window=5, center=True, min_periods=1).mean()
        baseline = short.rolling(window=75, center=True, min_periods=1).mean()
        bandpassed = short - baseline
        centered = bandpassed - bandpassed.mean()
        scale = bandpassed.std(ddof=0)
        if pd.isna(scale) or scale < 1e-6:
            normalized[col] = np.zeros(len(series), dtype=np.float32)
        else:
            normalized[col] = centered.div(scale).clip(-5, 5).to_numpy(dtype=np.float32)
    return pd.DataFrame(normalized)


def _build_common_time_grid(
    *,
    time_values: np.ndarray,
    marker_df: pd.DataFrame | None,
    target_hz: float,
) -> np.ndarray:
    start = float(time_values[0])
    end = float(time_values[-1])

    if marker_df is not None and not marker_df.empty:
        positive_markers = marker_df[marker_df["MarkerType"] > 0]
        if not positive_markers.empty:
            start = max(start, float(positive_markers["MarkerTime"].iloc[0]))

        trailing_negative = marker_df[
            (marker_df["MarkerType"] < 0) & (marker_df["MarkerTime"] > start)
        ]
        if not trailing_negative.empty:
            end = min(end, float(trailing_negative["MarkerTime"].iloc[0]))

    if not math.isfinite(start) or not math.isfinite(end) or end <= start:
        start = float(time_values[0])
        end = float(time_values[-1])

    step = 1.0 / max(target_hz, 1e-6)
    if end - start < step:
        return np.linspace(start, end if end > start else start + step, num=2, dtype=np.float64)

    return np.arange(start, end + step / 2.0, step, dtype=np.float64)


def _resample_matrix(
    time_values: np.ndarray,
    matrix: np.ndarray,
    common_time: np.ndarray,
) -> np.ndarray:
    matrix = np.asarray(matrix, dtype=np.float64)
    if matrix.ndim == 1:
        matrix = matrix[:, None]

    order = np.argsort(time_values)
    sorted_time = np.asarray(time_values, dtype=np.float64)[order]
    sorted_matrix = matrix[order]

    unique_time, unique_indices = np.unique(sorted_time, return_index=True)
    sorted_matrix = sorted_matrix[unique_indices]

    if len(unique_time) == 1:
        return np.repeat(sorted_matrix, len(common_time), axis=0)

    columns = [
        np.interp(common_time, unique_time, sorted_matrix[:, index])
        for index in range(sorted_matrix.shape[1])
    ]
    return np.stack(columns, axis=1).astype(np.float32)


def _ensure_time_values(
    time_values: np.ndarray | None,
    *,
    rows: int,
    target_hz: float,
) -> np.ndarray:
    if time_values is None or len(time_values) != rows:
        step = 1.0 / max(target_hz, 1e-6)
        return np.arange(rows, dtype=np.float64) * step
    return np.asarray(time_values, dtype=np.float64)


def _first_available_rows(*matrices: np.ndarray | None) -> int:
    for matrix in matrices:
        if matrix is not None:
            return int(matrix.shape[0])
    raise ValueError("No matrices available.")


def _ensure_optode_shape(matrix: np.ndarray) -> np.ndarray:
    matrix = np.asarray(matrix, dtype=np.float32)
    if matrix.ndim == 1:
        matrix = matrix[:, None]

    if matrix.shape[1] >= OPTODES_PER_REGION * 2:
        return matrix[:, : OPTODES_PER_REGION * 2]

    repeats = math.ceil((OPTODES_PER_REGION * 2) / matrix.shape[1])
    tiled = np.tile(matrix, (1, repeats))
    return tiled[:, : OPTODES_PER_REGION * 2]


def _read_fnirsoft_export(path: Path) -> tuple[pd.DataFrame, dict]:
    rows = _read_csv_rows(path)
    if not rows or rows[0][:2] != FNIRSOFT_HEADER:
        raise ValueError("Not a valid fnirSoft export CSV.")

    metadata: dict[str, str] = {}
    data_index = None
    for index, row in enumerate(rows):
        if row and row[0] == FNIRSOFT_DATA_SECTION:
            data_index = index
            break
        if len(row) >= 2 and row[0]:
            metadata[row[0].strip().rstrip(":")] = row[1].strip()

    if data_index is None:
        raise ValueError("fnirSoft export is missing a VariableData section.")

    non_empty = [
        (index, [cell.strip() for cell in row if cell is not None])
        for index, row in enumerate(rows[data_index + 1 :], start=data_index + 1)
        if any(cell.strip() for cell in row)
    ]
    if len(non_empty) < 2:
        raise ValueError("fnirSoft export does not contain enough rows after VariableData.")

    first_index, first_row = non_empty[0]
    second_index, second_row = non_empty[1]

    if _row_is_numeric(second_row):
        headers = _trim_row(first_row)
        data_start = second_index
    else:
        headers = _trim_row(second_row)
        data_start = second_index + 1

    records: list[list[float]] = []
    for row in rows[data_start:]:
        cells = _trim_row(row)
        if not cells:
            continue
        try:
            numeric = [float(cell) for cell in cells[: len(headers)]]
        except ValueError:
            continue
        if len(numeric) < len(headers):
            continue
        records.append(numeric)

    if not records:
        raise ValueError("fnirSoft export contains no numeric rows.")

    return pd.DataFrame(records, columns=headers), metadata


def _read_csv_rows(path: Path) -> list[list[str]]:
    with path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        return [[cell.strip() for cell in row] for row in csv.reader(f)]


def _row_is_numeric(row: list[str]) -> bool:
    try:
        [float(cell) for cell in row]
        return True
    except ValueError:
        return False


def _trim_row(row: list[str]) -> list[str]:
    trimmed = list(row)
    while trimmed and trimmed[-1] == "":
        trimmed.pop()
    return trimmed


def _classify_fnirsoft_dataframe(path: Path, df: pd.DataFrame, metadata: dict) -> str:
    name = path.name.lower()
    metadata_name = metadata.get("Name", "").lower()
    content = metadata.get("Content", "").lower()
    columns = [str(col).lower() for col in df.columns]

    if columns == ["time"]:
        return "time"
    if columns == ["markertime", "markertype"]:
        return "marker"
    if any("-730nm" in col or "-850nm" in col for col in columns):
        return "raw"
    if ".hbo." in name or ".hbo." in metadata_name or metadata.get("Labels", "").endswith("HBO"):
        return "hbo"
    if ".hbr." in name or ".hbr." in metadata_name or metadata.get("Labels", "").endswith("HBR"):
        return "hbr"
    if ".oxy." in name or ".oxy." in metadata_name:
        return "oxy"
    if content == "time":
        return "time"
    if content == "marker":
        return "marker"
    if content == "light":
        return "raw"
    if content == "hemoglobin":
        return "oxy"
    return "unknown"


def _read_optional_fnirsoft_sibling(path: Path, kind: str) -> pd.DataFrame | None:
    sibling = _replace_fnirsoft_token(path, kind)
    if sibling is None or not sibling.exists():
        return None
    try:
        df, _ = _read_fnirsoft_export(sibling)
        return df
    except Exception:
        return None


def _read_optional_time_sibling(path: Path) -> pd.DataFrame | None:
    sibling = _replace_block_suffix(path, ".Time1.csv")
    if sibling is None or not sibling.exists():
        return None
    try:
        df, _ = _read_fnirsoft_export(sibling)
        return df
    except Exception:
        return None


def _read_optional_marker_sibling(path: Path) -> pd.DataFrame | None:
    sibling = _replace_marker_suffix(path)
    if sibling is None or not sibling.exists():
        return None
    try:
        df, _ = _read_fnirsoft_export(sibling)
        return df
    except Exception:
        return None


def _replace_fnirsoft_token(path: Path, kind: str) -> Path | None:
    name = path.name
    for token in ("hbo", "hbr", "oxy", "raw"):
        replacement = re.sub(rf"\.{token}\.", f".{kind}.", name, flags=re.IGNORECASE)
        if replacement != name:
            return path.with_name(replacement)
    return None


def _replace_block_suffix(path: Path, suffix: str) -> Path | None:
    replacement = re.sub(r"\.Block\d+\.csv$", suffix, path.name, flags=re.IGNORECASE)
    if replacement == path.name:
        return None
    return path.with_name(replacement)


def _replace_marker_suffix(path: Path) -> Path | None:
    replacement = re.sub(
        r"\.(?:hbo|hbr|hbt|oxy|raw)\.(?:Block\d+|Time\d+)\.csv$",
        ".Marker1.csv",
        path.name,
        flags=re.IGNORECASE,
    )
    if replacement == path.name:
        return None
    return path.with_name(replacement)


def _optode_dataframe_to_matrix(df: pd.DataFrame) -> np.ndarray:
    numeric = df.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    return numeric.to_numpy(dtype=np.float32)


def _coerce_time_values(df: pd.DataFrame | None, *, rows: int) -> np.ndarray | None:
    if df is None or df.empty:
        return None
    numeric = df.iloc[:, 0].apply(pd.to_numeric, errors="coerce").dropna()
    if len(numeric) < rows:
        return None
    return numeric.iloc[:rows].to_numpy(dtype=np.float64)


def _normalize_marker_df(df: pd.DataFrame | None) -> pd.DataFrame | None:
    if df is None or df.empty:
        return None

    marker_df = df.copy()
    if "MarkerTime" not in marker_df.columns or "MarkerType" not in marker_df.columns:
        return None

    marker_df["MarkerTime"] = pd.to_numeric(marker_df["MarkerTime"], errors="coerce")
    marker_df["MarkerType"] = pd.to_numeric(marker_df["MarkerType"], errors="coerce")
    marker_df = marker_df.dropna(subset=["MarkerTime", "MarkerType"]).reset_index(drop=True)
    return marker_df if not marker_df.empty else None


def _fnirsoft_raw_light_to_matrices(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    numeric = df.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    columns = list(numeric.columns)

    pairs_730: list[str] = []
    pairs_850: list[str] = []
    ambients: list[str] = []
    for optode_index in range(1, OPTODES_PER_REGION * 2 + 1):
        prefix = f"optode{optode_index}"
        col_730 = next((col for col in columns if str(col).lower() == f"{prefix}-730nm"), None)
        col_850 = next((col for col in columns if str(col).lower() == f"{prefix}-850nm"), None)
        col_amb = next((col for col in columns if str(col).lower() == f"{prefix}-ambient"), None)
        if col_730 and col_850:
            pairs_730.append(col_730)
            pairs_850.append(col_850)
            ambients.append(col_amb)

    if len(pairs_730) < 1:
        raise ValueError("Could not locate raw 730/850nm columns in the fnirSoft light export.")

    raw_730 = numeric[pairs_730].to_numpy(dtype=np.float32)
    raw_850 = numeric[pairs_850].to_numpy(dtype=np.float32)
    if any(name is None for name in ambients):
        ambient = np.zeros_like(raw_730)
    else:
        ambient = numeric[[name for name in ambients]].to_numpy(dtype=np.float32)

    corrected_730 = np.maximum(raw_730 - ambient, 1.0)
    corrected_850 = np.maximum(raw_850 - ambient, 1.0)
    return corrected_730, corrected_850


def _read_raw_oxy_device_export(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    matrix = _read_numeric_lines(path)
    if matrix.shape[1] < 1 + OPTODES_PER_REGION * 2 * 2:
        raise ValueError("The raw .oxy device export does not contain the expected optode pairs.")

    time_values = matrix[:, 0]
    values = matrix[:, 1:]
    deoxy_cols = []
    oxy_cols = []
    for index in range(0, values.shape[1], 2):
        deoxy_cols.append(values[:, index])
        if index + 1 < values.shape[1]:
            oxy_cols.append(values[:, index + 1])

    oxy_matrix = np.stack(oxy_cols, axis=1).astype(np.float32)
    deoxy_matrix = np.stack(deoxy_cols, axis=1).astype(np.float32)
    return time_values, oxy_matrix, deoxy_matrix


def _read_raw_nir_device_export(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    matrix = _read_numeric_lines(path)
    if matrix.shape[1] < 1 + OPTODES_PER_REGION * 2 * 3:
        raise ValueError("The raw .nir device export does not contain the expected light triplets.")

    time_values = matrix[:, 0]
    values = matrix[:, 1:]
    triplets = []
    for index in range(0, values.shape[1], 3):
        if index + 2 >= values.shape[1]:
            break
        triplets.append(values[:, index : index + 3])

    light_cube = np.stack(triplets, axis=1).astype(np.float32)
    raw_730 = light_cube[:, :, 0]
    ambient = light_cube[:, :, 1]
    raw_850 = light_cube[:, :, 2]
    corrected_730 = np.maximum(raw_730 - ambient, 1.0)
    corrected_850 = np.maximum(raw_850 - ambient, 1.0)
    return time_values, corrected_730, corrected_850


def _read_numeric_lines(path: Path) -> np.ndarray:
    rows: list[list[float]] = []
    for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if not (line[0].isdigit() or (line[0] == "-" and len(line) > 1 and line[1].isdigit())):
            continue
        parts = [part for part in raw_line.split("\t") if part != ""]
        try:
            numeric = [float(part) for part in parts]
        except ValueError:
            continue
        rows.append(numeric)

    if not rows:
        raise ValueError(f"No numeric signal rows were found in {path.name}.")

    return np.asarray(rows, dtype=np.float64)
