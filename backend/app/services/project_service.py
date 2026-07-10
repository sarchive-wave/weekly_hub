from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.project import Project
from app.schemas.project import ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse


def get_projects(db: Session) -> List[ProjectResponse]:
    projects = db.query(Project).order_by(Project.sort_order.asc(), Project.id.asc()).all()
    return [ProjectResponse.model_validate(p) for p in projects]


def create_project(db: Session, req: ProjectCreateRequest) -> ProjectResponse:
    if db.query(Project).filter(Project.name == req.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트명입니다.")
    project = Project(name=req.name)
    db.add(project)
    db.commit()
    db.refresh(project)
    return ProjectResponse.model_validate(project)


def update_project(db: Session, project_id: int, req: ProjectUpdateRequest) -> ProjectResponse:
    project = _find(db, project_id)
    existing = db.query(Project).filter(Project.name == req.name, Project.id != project_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트명입니다.")
    project.name = req.name
    db.commit()
    db.refresh(project)
    return ProjectResponse.model_validate(project)


def delete_project(db: Session, project_id: int) -> None:
    project = _find(db, project_id)
    db.delete(project)
    db.commit()


def reorder_projects(db: Session, ids: List[int]) -> None:
    for order, pid in enumerate(ids, start=1):
        db.query(Project).filter(Project.id == pid).update({"sort_order": order})
    db.commit()


def _find(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프로젝트를 찾을 수 없습니다.")
    return project
