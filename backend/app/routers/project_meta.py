from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.project_meta import MetaCreateRequest, MetaUpdateRequest, MetaResponse
from app.services import project_meta_service

# kind: "type" (유형) | "status" (상태)
router = APIRouter(tags=["project-meta"])


@router.get("/{kind}", response_model=List[MetaResponse])
def list_meta(kind: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return project_meta_service.list_meta(db, kind)


@router.post("/{kind}", response_model=MetaResponse, status_code=201)
def create_meta(kind: str, req: MetaCreateRequest, db: Session = Depends(get_db),
                _: User = Depends(require_admin)):
    return project_meta_service.create_meta(db, kind, req)


@router.put("/{kind}/{meta_id}", response_model=MetaResponse)
def update_meta(kind: str, meta_id: int, req: MetaUpdateRequest, db: Session = Depends(get_db),
                _: User = Depends(require_admin)):
    return project_meta_service.update_meta(db, kind, meta_id, req)


@router.delete("/{kind}/{meta_id}", status_code=204)
def delete_meta(kind: str, meta_id: int, db: Session = Depends(get_db),
                _: User = Depends(require_admin)):
    project_meta_service.delete_meta(db, kind, meta_id)
