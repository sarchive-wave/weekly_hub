from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel


class WeekCreateRequest(BaseModel):
    year: int
    month: int
    week_num: int
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class WeekResponse(BaseModel):
    id: int
    year: int
    month: int
    week_num: int
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_at: datetime
    total_members: int = 0
    done_members: int = 0

    model_config = {"from_attributes": True}


class MemberStatusResponse(BaseModel):
    user_id: int
    display_name: str
    status: str
    sort_order: Optional[int]


class ProjectSummaryItem(BaseModel):
    project_id: int
    project_name: str
    current_work: List[str]
    next_work: List[str]


class OverallSummaryResponse(BaseModel):
    week_id: int
    title: str
    projects: List[ProjectSummaryItem]
