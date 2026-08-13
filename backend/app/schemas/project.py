from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel


# ── 프로젝트 ────────────────────────────────────────────────
class ProjectCreateRequest(BaseModel):
    code: Optional[str] = None          # 미지정 시 서버가 PRJ-000N 자동 생성
    name: str
    description: Optional[str] = None
    type_id: Optional[int] = None
    status_id: Optional[int] = None     # 미지정 시 '진행중'
    pm_user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    nas_path: Optional[str] = None
    git_url: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    pm_user_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    nas_path: Optional[str] = None
    git_url: Optional[str] = None


class ProjectReorderRequest(BaseModel):
    ids: List[int]


class ProjectMemberItem(BaseModel):
    user_id: int
    role: str = "member"   # pm | member


class ProjectMembersSetRequest(BaseModel):
    members: List[ProjectMemberItem]


class ProjectMemberResponse(BaseModel):
    user_id: int
    display_name: str
    position: Optional[str] = None
    team: Optional[str] = None
    role: str


class ProjectResponse(BaseModel):
    id: int
    code: Optional[str] = None
    name: str
    description: Optional[str] = None
    type_id: Optional[int] = None
    type_name: Optional[str] = None
    status_id: Optional[int] = None
    status_name: Optional[str] = None
    pm_user_id: Optional[int] = None
    pm_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    nas_path: Optional[str] = None
    git_url: Optional[str] = None
    sort_order: Optional[int] = None
    member_count: int = 0
    members: List[ProjectMemberResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProjectLogResponse(BaseModel):
    id: int
    actor_name: Optional[str] = None
    action: str
    field: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    created_at: datetime


class ProjectWeeklyItem(BaseModel):
    """프로젝트 상세에서 read-only로 보여주는 주차별 진행/계획"""
    week_id: int
    title: str
    year: int
    month: int
    week_num: int
    current_work: List[str]
    next_work: List[str]
