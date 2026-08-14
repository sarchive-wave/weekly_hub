from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import require_admin
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserUpdateRequest, ResetPasswordRequest, UserReorderRequest, UserResponse
from app.services import user_service

router = APIRouter(tags=["users"])


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return user_service.get_users(db)


@router.post("", response_model=UserResponse, status_code=201)
def create_user(req: UserCreateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return user_service.create_user(db, req)


@router.put("/reorder")
def reorder_users(req: UserReorderRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user_service.reorder_users(db, req.ids)
    return {"success": True, "data": None, "message": "순서가 저장되었습니다."}


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, req: UserUpdateRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return user_service.update_user(db, user_id, req)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    # 소프트 삭제(비활성 처리)
    user_service.delete_user(db, user_id)


@router.post("/{user_id}/activate", response_model=UserResponse)
def activate_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return user_service.activate_user(db, user_id)


@router.post("/{user_id}/reset-password")
def reset_password(user_id: int, req: ResetPasswordRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user_service.reset_password(db, user_id, req.new_password)
    return {"success": True, "data": None, "message": "비밀번호가 초기화되었습니다."}
