from typing import Optional
from pydantic import BaseModel


# ── 프로젝트 유형/상태 마스터 ──────────────────────────────
class MetaCreateRequest(BaseModel):
    name: str
    sort_order: Optional[int] = None


class MetaUpdateRequest(BaseModel):
    name: str
    sort_order: Optional[int] = None


class MetaResponse(BaseModel):
    id: int
    name: str
    sort_order: int

    model_config = {"from_attributes": True}
