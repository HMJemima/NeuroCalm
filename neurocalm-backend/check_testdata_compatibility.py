import csv
import json
from collections import Counter
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = BACKEND_DIR.parent / "model"
DEFAULT_TESTDATA_DIR = BACKEND_DIR.parent / "TestData"


def load_metadata(model_dir: Path) -> dict:
    metadata_path = model_dir / "deploy_metadata.json"
    with metadata_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def classify_csv(path: Path, expected_cols: list[str]) -> tuple[str, str]:
    with path.open("r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f)
        rows = []
        for _, row in zip(range(20), reader):
            rows.append(row)

    for row in rows:
        normalized = [cell.strip() for cell in row]
        if all(col in normalized for col in expected_cols):
            return "compatible_csv", "contains all expected feature columns"

    if rows and rows[0][:2] == ["fnirSoft:", "Exported CSV File"]:
        dims = next((row[1] for row in rows if row and row[0] == "Size:" and len(row) > 1), "unknown")
        return (
            "fnirsoft_export",
            f"raw fnirSoft export detected ({dims}); does not expose model feature columns",
        )

    header = rows[0] if rows else []
    return (
        "other_csv",
        "csv found, but expected feature columns are missing from the header"
        if header
        else "empty csv file",
    )


def classify_file(path: Path, expected_cols: list[str]) -> tuple[str, str]:
    ext = path.suffix.lower()
    if ext == ".csv":
        return classify_csv(path, expected_cols)
    if ext in {".oxy", ".nir"}:
        return "raw_device_export", "device export; requires preprocessing before inference"
    if ext in {".mat", ".edf"}:
        return "maybe_supported", "supported by backend extension, but not checked here"
    return "ignored", f"unsupported extension {ext or '<none>'}"


def main() -> None:
    model_dir = DEFAULT_MODEL_DIR
    testdata_dir = DEFAULT_TESTDATA_DIR

    metadata = load_metadata(model_dir)
    expected_cols = metadata["feature_cols"]

    print(f"Model folder: {model_dir}")
    print(f"TestData folder: {testdata_dir}")
    print(f"Expected feature columns: {', '.join(expected_cols)}")
    print(f"Expected timesteps: {metadata['timesteps']}")
    print()

    results: list[tuple[Path, str, str]] = []
    for path in sorted(testdata_dir.rglob("*")):
        if not path.is_file():
            continue
        kind, reason = classify_file(path, expected_cols)
        if kind != "ignored":
            results.append((path, kind, reason))

    counts = Counter(kind for _, kind, _ in results)
    for kind, count in sorted(counts.items()):
        print(f"{kind}: {count}")

    print()
    compatible = [item for item in results if item[1] == "compatible_csv"]
    if compatible:
        print("Compatible files:")
        for path, _, reason in compatible[:10]:
            print(f"  OK  {path} :: {reason}")
    else:
        print("Compatible files:")
        print("  None found")

    print()
    print("Sample incompatible files:")
    shown = 0
    for path, kind, reason in results:
        if kind == "compatible_csv":
            continue
        print(f"  {kind:17} {path} :: {reason}")
        shown += 1
        if shown >= 5:
            break


if __name__ == "__main__":
    main()
