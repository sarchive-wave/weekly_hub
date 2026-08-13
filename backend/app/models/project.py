from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True)          # 프로젝트 코드
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)                       # 소개
    type_id = Column(Integer, ForeignKey("common.project_types.id"))
    status_id = Column(Integer, ForeignKey("common.project_statuses.id"))
    pm_user_id = Column(Integer, ForeignKey("common.users.id"))
    start_date = Column(Date)                        # 시작일
    end_date = Column(Date)                          # 마감예정일
    nas_path = Column(String(300))                   # NAS 공유폴더
    git_url = Column(String(300))                    # Git 저장소
    show_in_dashboard = Column(Boolean, nullable=False, default=True)  # 대시보드 노출
    show_in_weekly = Column(Boolean, nullable=False, default=True)     # 주간회의 노출
    sort_order = Column(Integer, default=999)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    type = relationship("ProjectType")
    status = relationship("ProjectStatus")
    pm = relationship("User", foreign_keys=[pm_user_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
