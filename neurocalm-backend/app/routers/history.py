from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.analysis import HistoryResponse, AnalysisHistoryItem
from app.utils.confidence import get_display_confidence
from app.utils.dependencies import get_current_user
from app.services.analysis_service import get_history

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryResponse)
async def get_analysis_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await get_history(db, current_user, page, page_size)

    return HistoryResponse(
        items=[
            AnalysisHistoryItem(
                id=a.id,
                filename=a.filename,
                stress_score=a.stress_score,
                confidence=get_display_confidence(
                    a.confidence,
                    stress_score=a.stress_score,
                    workload_class=a.workload_class,
                    features_count=a.features_count,
                ),
                workload_class=a.workload_class,
                class_probabilities=a.class_probabilities or [],
                created_at=a.created_at,
                user_name=a.user.full_name,
                user_email=a.user.email,
            )
            for a in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )
