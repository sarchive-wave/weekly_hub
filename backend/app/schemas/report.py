from typing import List
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
    project_id: int
    project_name: str
    current_work: str
    next_work: str


class ReportResponse(BaseModel):
    week_id: int
    user_id: int
    status: str
    entries: List[EntryResponse]
