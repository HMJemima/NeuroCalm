from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.analysis import AdminStats, ModelInfoOut
from app.schemas.user import AdminUserOut, AdminUserUpdate, AdminUserCreate
from app.schemas.admin import (
    AdminAnalysesResponse,
    AnalyticsResponse,
    ServerStatusResponse,
    SystemSettingsOut,
    SystemSettingsUpdate,
)
from app.utils.dependencies import get_admin_user
from app.services.admin_service import (
    get_system_stats,
    get_all_users,
    create_user,
    update_user,
    delete_user,
    get_model_info,
    get_all_analyses,
    get_analytics,
    get_system_settings,
    update_system_settings,
)
from app.services.server_service import (
    get_resource_stats,
    get_services_status,
    get_recent_logs,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# --- Existing endpoints ---

@router.get("/stats", response_model=AdminStats)
async def system_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await get_system_stats(db)
    return stats


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    users, _ = await get_all_users(db, page, page_size)
    return users


@router.post("/users", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(
    data: AdminUserCreate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await create_user(db, data.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put("/users/{user_id}", response_model=AdminUserOut)
async def update_user_endpoint(
    user_id: str,
    data: AdminUserUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    updated = await update_user(db, user_id, data.model_dump(exclude_unset=True))
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: str,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_user(db, user_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")


@router.get("/model", response_model=ModelInfoOut)
async def model_info(admin: User = Depends(get_admin_user)):
    return get_model_info()


# --- Admin Analyses ---

@router.get("/analyses", response_model=AdminAnalysesResponse)
async def list_analyses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search by filename, user name, or email"),
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    items, total = await get_all_analyses(db, page, page_size, search)
    return AdminAnalysesResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


# --- Analytics ---

@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_analytics(db)


# --- Server Status ---

@router.get("/server", response_model=ServerStatusResponse)
async def server_status(admin: User = Depends(get_admin_user)):
    return ServerStatusResponse(
        resources=get_resource_stats(),
        services=get_services_status(),
        logs=get_recent_logs(),
    )


# --- System Settings ---

@router.get("/settings", response_model=SystemSettingsOut)
async def get_settings(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_system_settings(db)


@router.put("/settings", response_model=SystemSettingsOut)
async def update_settings(
    data: SystemSettingsUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_system_settings(db, data.model_dump(exclude_unset=True))
