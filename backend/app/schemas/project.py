from typing import List, Optional
from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    name: str


class ProjectUpdateRequest(BaseModel):
    name: str


class ProjectReorderRequest(BaseModel):
    ids: List[int]


class ProjectResponse(BaseModel):
    id: int
    name: str
    sort_order: Optional[int]

    model_config = {"from_attributes": True}
