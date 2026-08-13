from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    sort_order = Column(Integer, default=999)
    created_at = Column(DateTime, default=datetime.utcnow)
    # 확장 컬럼은 Phase 2에서 모델/스키마로 매핑 (DB에는 이미 존재)
