from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.project import (
    ProjectCreateRequest, ProjectUpdateRequest, ProjectReorderRequest, ProjectResponse,
    ProjectMembersSetRequest, ProjectMemberResponse, ProjectLogResponse, ProjectWeeklyItem,
)
from app.services import project_service, project_log_service

router = APIRouter(tags=["projects"])


# ── 목록/생성/정렬 ──────────────────────────────────────────
@router.get("", response_model=List[ProjectResponse])
def list_projects(status: Optional[str] = None, db: Session = Depends(get_db),
                  user: User = Depends(get_current_user)):
    # status=진행중|완료 로 필터 (종료 메뉴는 status=완료), 개인 순서 적용
    return project_service.get_projects(db, status, user.id)


@router.put("/my-order")
def set_my_order(req: ProjectReorderRequest, db: Session = Depends(get_db),
                 user: User = Depends(get_current_user)):
    # 사용자 개인 프로젝트 표시 순서 저장
    project_service.set_my_order(db, user.id, req.ids)
    return {"success": True, "data": None, "message": "순서가 저장되었습니다."}


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db),
                   admin: User = Depends(require_admin)):
    return project_service.create_project(db, req, admin.id)


@router.put("/reorder")
def reorder_projects(req: ProjectReorderRequest, db: Session = Depends(get_db),
                     _: User = Depends(require_admin)):
    project_service.reorder_projects(db, req.ids)
    return {"success": True, "data": None, "message": "순서가 저장되었습니다."}


# ── 상세/수정/상태 ──────────────────────────────────────────
@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db),
                _: User = Depends(get_current_user)):
    return project_service.get_project(db, project_id)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, req: ProjectUpdateRequest, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    # 권한(관리자/담당 PM)은 서비스에서 검사
    return project_service.update_project(db, project_id, req, user)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db),
                   _: User = Depends(require_admin)):
    project_service.delete_project(db, project_id)


@router.post("/{project_id}/complete", response_model=ProjectResponse)
def complete_project(project_id: int, db: Session = Depends(get_db),
                     user: User = Depends(get_current_user)):
    return project_service.complete_project(db, project_id, user)


@router.post("/{project_id}/reopen", response_model=ProjectResponse)
def reopen_project(project_id: int, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    return project_service.reopen_project(db, project_id, user)


# ── 구성원 ──────────────────────────────────────────────────
@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def get_members(project_id: int, db: Session = Depends(get_db),
                _: User = Depends(get_current_user)):
    return project_service.get_members(db, project_id)


@router.put("/{project_id}/members", response_model=List[ProjectMemberResponse])
def set_members(project_id: int, req: ProjectMembersSetRequest, db: Session = Depends(get_db),
                user: User = Depends(get_current_user)):
    return project_service.set_members(db, project_id, req.members, user)


# ── 감사 로그 / 주간 read ───────────────────────────────────
@router.get("/{project_id}/logs", response_model=List[ProjectLogResponse])
def get_logs(project_id: int, db: Session = Depends(get_db),
             _: User = Depends(get_current_user)):
    return project_log_service.get_logs(db, project_id)


@router.get("/{project_id}/weekly", response_model=List[ProjectWeeklyItem])
def get_weekly(project_id: int, db: Session = Depends(get_db),
               _: User = Depends(get_current_user)):
    return project_service.get_weekly(db, project_id)
