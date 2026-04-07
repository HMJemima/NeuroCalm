import io
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.utils.confidence import get_display_confidence
from app.utils.dependencies import get_current_user
from app.services.analysis_service import get_analysis_by_id

router = APIRouter(prefix="/reports", tags=["Reports"])

CLASS_LABELS = ["0-back", "1-back", "2-back", "3-back"]
WORKLOAD_STATE_LABELS = ["Very Relaxed", "Relaxed", "Moderate", "Stressed"]


@router.get("/{analysis_id}/json")
async def download_report_json(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    class_probs = analysis.class_probabilities or [0.25, 0.25, 0.25, 0.25]
    display_confidence = get_display_confidence(
        analysis.confidence,
        stress_score=analysis.stress_score,
        workload_class=analysis.workload_class,
        features_count=analysis.features_count,
    )
    report = {
        "id": analysis.id,
        "filename": analysis.filename,
        "stress_score": analysis.stress_score,
        "confidence": display_confidence,
        "stress_probability": analysis.stress_probability,
        "features_count": analysis.features_count,
        "band_powers": analysis.band_powers,
        "workload_class": analysis.workload_class,
        "workload_label": _workload_label(analysis.workload_class),
        "class_probabilities": {
            label: round(p * 100, 1)
            for label, p in zip(WORKLOAD_STATE_LABELS, class_probs)
        },
        "analyzed_by": analysis.user.full_name,
        "created_at": analysis.created_at.isoformat(),
    }

    content = json.dumps(report, indent=2)
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=neurocalm_report_{analysis_id}.json"},
    )


def _stress_label(score):
    if score <= 25:
        return "Very Relaxed"
    if score <= 50:
        return "Relaxed"
    if score <= 75:
        return "Moderate"
    return "Stressed"


def _workload_label(cls: int) -> str:
    try:
        class_index = int(cls)
    except (TypeError, ValueError):
        return "Unknown"
    return WORKLOAD_STATE_LABELS[class_index] if class_index < len(WORKLOAD_STATE_LABELS) else "Unknown"


def _build_pdf(analysis) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Title
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 15, "NeuroCalm", new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "fNIRS Cognitive Workload Analysis Report", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(10)

    # Divider
    pdf.set_draw_color(30, 58, 138)
    pdf.set_line_width(0.5)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(8)

    # Report Info
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Report Details", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    info_rows = [
        ("Report ID:", analysis.id),
        ("File Analyzed:", analysis.filename),
        ("Analyzed By:", analysis.user.full_name),
        ("Date:", analysis.created_at.strftime("%B %d, %Y at %I:%M %p")),
    ]
    for label, value in info_rows:
        pdf.cell(45, 7, label)
        pdf.cell(0, 7, str(value), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Workload Classification
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Cognitive Workload Classification", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    wl_label = _workload_label(analysis.workload_class)
    class_probs = analysis.class_probabilities or [0.25, 0.25, 0.25, 0.25]

    pdf.cell(45, 7, "Predicted Class:")
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(30, 58, 138)
    pdf.cell(0, 7, f"{wl_label} (class {analysis.workload_class})", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    pdf.ln(2)
    # Class probability bars
    bar_x = 70
    bar_max_w = 100
    colors = [
        (34, 197, 94),
        (6, 182, 212),
        (251, 191, 36),
        (239, 68, 68),
    ]
    for i, (label, prob) in enumerate(zip(WORKLOAD_STATE_LABELS, class_probs)):
        y = pdf.get_y()
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(50, 7, f"{label}")

        pdf.set_fill_color(230, 230, 230)
        pdf.rect(bar_x, y + 1.5, bar_max_w, 4, "F")

        bar_w = max(1, prob * bar_max_w)
        pdf.set_fill_color(*colors[i])
        pdf.rect(bar_x, y + 1.5, bar_w, 4, "F")

        pdf.set_xy(bar_x + bar_max_w + 3, y)
        pdf.cell(20, 7, f"{prob * 100:.1f}%", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # Stress Detection Results
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Derived Stress Metrics", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    label = _stress_label(analysis.stress_score)

    if analysis.stress_score <= 25:
        score_r, score_g, score_b = 34, 139, 34
    elif analysis.stress_score <= 50:
        score_r, score_g, score_b = 6, 140, 170
    elif analysis.stress_score <= 75:
        score_r, score_g, score_b = 218, 165, 32
    else:
        score_r, score_g, score_b = 200, 50, 50

    pdf.cell(45, 7, "Stress Score:")
    pdf.set_text_color(score_r, score_g, score_b)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, f"{analysis.stress_score}/100 ({label})", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    results = [
        ("Confidence:", f"{display_confidence}%"),
        ("Stress Probability:", f"{analysis.stress_probability}%"),
        ("Features Extracted:", f"{analysis.features_count:,}"),
    ]
    for lbl, val in results:
        pdf.cell(45, 7, lbl)
        pdf.cell(0, 7, val, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)

    # Band Power Analysis
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Spectral Power Analysis", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    bp = analysis.band_powers
    bands = [
        ("Delta (0.5-4 Hz)", bp.get("delta", 0), (99, 102, 241)),
        ("Theta (4-8 Hz)", bp.get("theta", 0), (139, 92, 246)),
        ("Alpha (8-13 Hz)", bp.get("alpha", 0), (34, 197, 94)),
        ("Beta (13-30 Hz)", bp.get("beta", 0), (251, 191, 36)),
        ("Gamma (30-100 Hz)", bp.get("gamma", 0), (239, 68, 68)),
    ]

    for name, value, color in bands:
        y = pdf.get_y()
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(60, 60, 60)
        pdf.cell(50, 7, name)

        pdf.set_fill_color(230, 230, 230)
        pdf.rect(bar_x, y + 1.5, bar_max_w, 4, "F")

        bar_w = max(1, value / 100 * bar_max_w)
        pdf.set_fill_color(*color)
        pdf.rect(bar_x, y + 1.5, bar_w, 4, "F")

        pdf.set_xy(bar_x + bar_max_w + 3, y)
        pdf.cell(20, 7, f"{value:.1f}%", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # Interpretation
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 8, "Interpretation", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(60, 60, 60)

    if analysis.workload_class == 0:
        text = (
            "The fNIRS analysis indicates a VERY RELAXED cognitive state. "
            "Hemodynamic patterns suggest minimal "
            "working memory demand."
        )
    elif analysis.workload_class == 1:
        text = (
            "The fNIRS analysis indicates a RELAXED cognitive state. "
            "Light prefrontal activation detected. The subject is engaged but "
            "not under significant cognitive strain."
        )
    elif analysis.workload_class == 2:
        text = (
            "The fNIRS analysis indicates a MODERATE cognitive workload state. "
            "Elevated prefrontal cortex activity suggests sustained working memory "
            "engagement. Consider periodic breaks to manage cognitive fatigue."
        )
    else:
        text = (
            "The fNIRS analysis indicates a STRESSED cognitive workload state. "
            "Significant hemodynamic response detected in prefrontal regions, "
            "consistent with heavy working memory demand. Stress management "
            "strategies are recommended."
        )

    pdf.multi_cell(0, 6, text)
    pdf.ln(10)

    # Footer
    pdf.set_draw_color(30, 58, 138)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(130, 130, 130)
    pdf.cell(0, 5, "Generated by NeuroCalm - AI-Powered fNIRS Stress Detection", align="C")

    return pdf.output()


@router.get("/{analysis_id}/pdf")
async def download_report_pdf(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    pdf_bytes = _build_pdf(analysis)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=neurocalm_report_{analysis_id}.pdf"},
    )
    display_confidence = get_display_confidence(
        analysis.confidence,
        stress_score=analysis.stress_score,
        workload_class=analysis.workload_class,
        features_count=analysis.features_count,
    )
