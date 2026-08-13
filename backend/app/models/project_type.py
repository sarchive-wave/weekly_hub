from sqlalchemy import Column, Integer, String
from app.database import Base


class ProjectType(Base):
    """프로젝트 유형 마스터: PoC / 본사업 / 연구개발"""
    __tablename__ = "project_types"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    sort_order = Column(Integer, default=0)
