from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest, ProjectReorderRequest, ProjectResponse
from app.services import project_service

router = APIRouter(tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return project_service.get_projects(db)


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return project_service.create_project(db, req)


@router.put("/reorder")
def reorder_projects(req: ProjectReorderRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    project_service.reorder_projects(db, req.ids)
    return {"success": True, "data": None, "message": "순서가 저장되었습니다."}


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, req: ProjectUpdateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return project_service.update_project(db, project_id, req)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    project_service.delete_project(db, project_id)
