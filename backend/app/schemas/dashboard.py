from datetime import date
from typing import List, Optional
from pydantic import BaseModel


class DashboardItem(BaseModel):
    project_id: int
    code: Optional[str] = None
    name: str
    type_name: Optional[str] = None
    status_name: Optional[str] = None
    pm_name: Optional[str] = None
    member_count: int = 0
    member_names: List[str] = []
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CountItem(BaseModel):
    name: str
    count: int


class DashboardResponse(BaseModel):
    total: int
    by_status: List[CountItem]
    by_type: List[CountItem]
    items: List[DashboardItem]
