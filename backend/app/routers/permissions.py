from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import require_admin
from app.models.user import User
from app.schemas.permission import PermissionSetRequest
from app.services import permission_service

router = APIRouter(tags=["permissions"])


@router.get("")
def get_permissions(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return permission_service.get_matrix(db)


@router.put("")
def set_permission(req: PermissionSetRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return permission_service.set_permission(db, req.role, req.permission, req.enabled)
