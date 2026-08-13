from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class UserCreateRequest(BaseModel):
    username: str
    password: str
    display_name: str
    role: str = "user"
    position: Optional[str] = None
    team: Optional[str] = None


class UserUpdateRequest(BaseModel):
    display_name: str
    role: str
    is_active: bool
    position: Optional[str] = None
    team: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    new_password: str


class UserReorderRequest(BaseModel):
    ids: List[int]


class UserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    role: str
    position: Optional[str] = None
    team: Optional[str] = None
    is_active: bool
    sort_order: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
