from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ProjectLog(Base):
    """프로젝트 감사 로그: 마감일/상태/PM/팀원 등 변경 이력"""
    __tablename__ = "project_logs"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("common.projects.id", ondelete="CASCADE"), nullable=False)
    actor_user_id = Column(Integer, ForeignKey("common.users.id"))
    action = Column(String(100), nullable=False)   # 예: "마감일 변경", "완료 처리"
    field = Column(String(50))                     # end_date | status | pm | member ...
    old_value = Column(Text)
    new_value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User")
