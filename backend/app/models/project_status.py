from sqlalchemy import Column, Integer, String
from app.database import Base


class ProjectStatus(Base):
    """프로젝트 상태 마스터: 진행중 / 완료"""
    __tablename__ = "project_statuses"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    sort_order = Column(Integer, default=0)
