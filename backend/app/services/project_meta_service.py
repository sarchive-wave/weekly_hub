from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project_type import ProjectType
from app.models.project_status import ProjectStatus
from app.models.project import Project
from app.schemas.project_meta import MetaCreateRequest, MetaUpdateRequest, MetaResponse

# (model, 사용중 참조 컬럼, 라벨)
_KINDS = {
    "type": (ProjectType, Project.type_id, "유형"),
    "status": (ProjectStatus, Project.status_id, "상태"),
}


def _model(kind: str):
    if kind not in _KINDS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="알 수 없는 마스터 종류입니다.")
    return _KINDS[kind]


def list_meta(db: Session, kind: str) -> List[MetaResponse]:
    model, _, _ = _model(kind)
    rows = db.query(model).order_by(model.sort_order.asc(), model.id.asc()).all()
    return [MetaResponse.model_validate(r) for r in rows]


def create_meta(db: Session, kind: str, req: MetaCreateRequest) -> MetaResponse:
    model, _, label = _model(kind)
    if db.query(model).filter(model.name == req.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"이미 존재하는 {label}명입니다.")
    order = req.sort_order if req.sort_order is not None else db.query(model).count() + 1
    row = model(name=req.name, sort_order=order)
    db.add(row)
    db.commit()
    db.refresh(row)
    return MetaResponse.model_validate(row)


def update_meta(db: Session, kind: str, meta_id: int, req: MetaUpdateRequest) -> MetaResponse:
    model, _, label = _model(kind)
    row = db.query(model).filter(model.id == meta_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label}을(를) 찾을 수 없습니다.")
    dup = db.query(model).filter(model.name == req.name, model.id != meta_id).first()
    if dup:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"이미 존재하는 {label}명입니다.")
    row.name = req.name
    if req.sort_order is not None:
        row.sort_order = req.sort_order
    db.commit()
    db.refresh(row)
    return MetaResponse.model_validate(row)


def delete_meta(db: Session, kind: str, meta_id: int) -> None:
    model, ref_col, label = _model(kind)
    row = db.query(model).filter(model.id == meta_id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label}을(를) 찾을 수 없습니다.")
    in_use = db.query(Project).filter(ref_col == meta_id).count()
    if in_use > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"해당 {label}을(를) 사용하는 프로젝트가 {in_use}건 존재합니다.")
    db.delete(row)
    db.commit()
