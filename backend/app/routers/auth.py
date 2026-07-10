from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, ChangePasswordRequest, UserMeResponse
from app.services import auth_service

router = APIRouter(tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    token = auth_service.login(db, req.username, req.password)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user)):
    return UserMeResponse.model_validate(current_user)


@router.put("/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    auth_service.change_password(db, current_user, req.current_password, req.new_password)
    return {"success": True, "data": None, "message": "비밀번호가 변경되었습니다."}
