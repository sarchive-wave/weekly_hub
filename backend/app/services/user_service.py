from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreateRequest, UserUpdateRequest, UserResponse
from app.services.auth_service import hash_password


def get_users(db: Session) -> List[UserResponse]:
    users = db.query(User).order_by(User.sort_order.asc(), User.id.asc()).all()
    return [UserResponse.model_validate(u) for u in users]


def create_user(db: Session, req: UserCreateRequest) -> UserResponse:
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 사용 중인 아이디입니다.")
    if len(req.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비밀번호는 6자 이상이어야 합니다.")
    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        display_name=req.display_name,
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def update_user(db: Session, user_id: int, req: UserUpdateRequest) -> UserResponse:
    user = _find(db, user_id)
    user.display_name = req.display_name
    user.role = req.role
    user.is_active = req.is_active
    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


def delete_user(db: Session, user_id: int) -> None:
    user = _find(db, user_id)
    db.delete(user)
    db.commit()


def reset_password(db: Session, user_id: int, new_password: str) -> None:
    if len(new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="비밀번호는 6자 이상이어야 합니다.")
    user = _find(db, user_id)
    user.password_hash = hash_password(new_password)
    db.commit()


def reorder_users(db: Session, ids: List[int]) -> None:
    for order, uid in enumerate(ids, start=1):
        db.query(User).filter(User.id == uid).update({"sort_order": order})
    db.commit()


def _find(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="사용자를 찾을 수 없습니다.")
    return user
