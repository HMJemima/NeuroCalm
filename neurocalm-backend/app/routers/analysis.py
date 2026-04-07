from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.analysis import AnalysisOut
from app.utils.dependencies import get_current_user
from app.utils.confidence import get_display_confidence
from app.services.analysis_service import save_upload, run_analysis, get_analysis_by_id, delete_analysis

settings = get_settings()
router = APIRouter(prefix="/analysis", tags=["Analysis"])


def _analysis_to_out(analysis, user_name: str, user_email: str) -> AnalysisOut:
    return AnalysisOut(
        id=analysis.id,
        filename=analysis.filename,
        stress_score=analysis.stress_score,
        confidence=get_display_confidence(
            analysis.confidence,
            stress_score=analysis.stress_score,
            workload_class=analysis.workload_class,
            features_count=analysis.features_count,
        ),
        stress_probability=analysis.stress_probability,
        features_count=analysis.features_count,
        band_powers=analysis.band_powers,
        workload_class=analysis.workload_class,
        class_probabilities=analysis.class_probabilities or [],
        created_at=analysis.created_at,
        user_name=user_name,
        user_email=user_email,
    )


@router.post("/upload", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
async def upload_and_analyze(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file size
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit",
        )

    # Save file
    file_path = await save_upload(content, file.filename)

    # Run analysis
    try:
        analysis = await run_analysis(db, current_user, file.filename, file_path)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _analysis_to_out(analysis, current_user.full_name, current_user.email)


@router.get("/{analysis_id}", response_model=AnalysisOut)
async def get_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await get_analysis_by_id(db, analysis_id, current_user)
    if analysis is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    return _analysis_to_out(analysis, analysis.user.full_name, analysis.user.email)


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_analysis(
    analysis_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_analysis(db, analysis_id, current_user)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
