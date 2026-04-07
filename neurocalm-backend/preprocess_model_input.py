from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

from app.config import get_settings
from app.utils.fnirs_preprocessing import (
    discover_candidate_files,
    inspect_input_file,
    preprocess_supported_input,
    write_report,
)


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = BACKEND_DIR.parent / "TestData"
DEFAULT_OUTPUT_DIR = BACKEND_DIR / "preprocessed"
DEFAULT_REPORT = BACKEND_DIR / "preprocessing-report.json"


def build_output_path(input_path: Path, input_root: Path, output_root: Path) -> Path:
    if input_root.is_dir():
        try:
            relative_parent = input_path.parent.relative_to(input_root)
        except ValueError:
            relative_parent = Path()
    else:
        relative_parent = Path()

    return output_root / relative_parent / f"{input_path.stem}.model_ready.csv"


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Inspect fNIRS files for SALIENT compatibility and convert any "
            "already model-ready CSVs into chunked windows."
        )
    )
    parser.add_argument(
        "input",
        nargs="?",
        default=str(DEFAULT_INPUT),
        help="File or folder to inspect. Defaults to ../TestData.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Folder where converted model-ready CSVs should be written.",
    )
    parser.add_argument(
        "--report",
        default=str(DEFAULT_REPORT),
        help="JSON report path.",
    )
    parser.add_argument(
        "--report-only",
        action="store_true",
        help="Inspect files without writing converted CSV output.",
    )
    args = parser.parse_args()

    settings = get_settings()
    expected_cols = settings.fnirs_feature_list

    input_root = Path(args.input).resolve()
    output_root = Path(args.output_dir).resolve()
    report_path = Path(args.report).resolve()

    candidates = discover_candidate_files(input_root, expected_cols)
    if input_root.is_file() and not candidates:
        candidates = [input_root]

    records: list[dict] = []
    kinds = Counter()
    converted_paths: list[Path] = []

    for path in candidates:
        inspection = inspect_input_file(path, expected_cols)
        record = inspection.to_dict()
        kinds[inspection.kind] += 1

        if inspection.compatible or inspection.details.get("experimental_pipeline"):
            try:
                processed = preprocess_supported_input(
                    path,
                    expected_cols=expected_cols,
                    window_size=settings.WINDOW_SIZE,
                    stride=settings.WINDOW_STRIDE,
                )
            except Exception as exc:
                record["compatible"] = False
                record["kind"] = "processing_error"
                record["reason"] = f"Failed to preprocess the input: {exc}"
                kinds["processing_error"] += 1
            else:
                record["compatible"] = True
                record["experimental_conversion"] = not inspection.compatible
                record["window_count"] = int(processed["chunk"].nunique())
                record["row_count"] = int(len(processed))

                if not args.report_only:
                    output_path = build_output_path(path, input_root, output_root)
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    processed.to_csv(output_path, index=False)
                    record["output_path"] = str(output_path)
                    converted_paths.append(output_path)

        records.append(record)

    write_report(report_path, records)

    print(f"Input root: {input_root}")
    print(f"Candidates inspected: {len(candidates)}")
    print(f"Expected features: {', '.join(expected_cols)}")
    print(f"Window size: {settings.WINDOW_SIZE}")
    print(f"Stride: {settings.WINDOW_STRIDE}")
    print()
    print("Kinds:")
    for kind, count in sorted(kinds.items()):
        print(f"  {kind}: {count}")

    print()
    print("Converted files:")
    if converted_paths:
        for path in converted_paths[:10]:
            print(f"  {path}")
    else:
        print("  None")

    print()
    print(f"Report written to: {report_path}")
    print(
        "Note: raw fnirSoft/.nir/.oxy exports are converted with an experimental "
        "assumption-based mapping into the Tufts-style 8-feature space before windowing."
    )


if __name__ == "__main__":
    main()
