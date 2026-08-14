from typing import List, Optional
from pydantic import BaseModel


class EntryData(BaseModel):
    project_id: int
    current_work: str = ""
    next_work: str = ""


class ReportSaveRequest(BaseModel):
    entries: List[EntryData]


class StatusUpdateRequest(BaseModel):
    status: str


class EntryResponse(BaseModel):
    project_id: Optional[int] = None   # 프로젝트 삭제 시 None(과거 항목 보존)
    project_name: str
    current_work: str
    next_work: str


class ReportResponse(BaseModel):
    week_id: int
    user_id: int
    status: str
    entries: List[EntryResponse]
