from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.report import ReportSaveRequest, ReportResponse, StatusUpdateRequest
from app.services import report_service

router = APIRouter(tags=["reports"])


def _check_read(current_user: User, user_id: int):
    # 읽기: 관리자 또는 본인
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="권한이 없습니다.")


def _check_write(current_user: User, user_id: int):
    # 쓰기(작성/수정/상태변경): 본인만 (관리자도 타인 보고는 read-only)
    if current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="본인의 주간보고만 작성/수정할 수 있습니다.")


@router.get("/{week_id}/{user_id}", response_model=ReportResponse)
def get_report(week_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_read(current_user, user_id)
    return report_service.get_report(db, week_id, user_id)


@router.put("/{week_id}/{user_id}", response_model=ReportResponse)
def save_report(week_id: int, user_id: int, req: ReportSaveRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_write(current_user, user_id)
    return report_service.save_report(db, week_id, user_id, req)


@router.patch("/{week_id}/{user_id}/status", response_model=ReportResponse)
def update_status(week_id: int, user_id: int, req: StatusUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _check_write(current_user, user_id)
    return report_service.update_status(db, week_id, user_id, req.status)
