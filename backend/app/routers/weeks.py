from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.week import WeekCreateRequest, WeekResponse, MemberStatusResponse, OverallSummaryResponse
from app.services import week_service

router = APIRouter(tags=["weeks"])


@router.get("", response_model=List[WeekResponse])
def list_weeks(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return week_service.get_weeks(db)


@router.post("", response_model=WeekResponse, status_code=201)
def create_week(req: WeekCreateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return week_service.create_week(db, req)


@router.put("/{week_id}", response_model=WeekResponse)
def update_week(week_id: int, req: WeekCreateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return week_service.update_week(db, week_id, req)


@router.delete("/{week_id}", status_code=204)
def delete_week(week_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    week_service.delete_week(db, week_id)


@router.get("/{week_id}/members", response_model=List[MemberStatusResponse])
def get_members(week_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return week_service.get_members(db, week_id)


@router.get("/{week_id}/summary", response_model=OverallSummaryResponse)
def get_summary(week_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return week_service.get_summary(db, week_id)
