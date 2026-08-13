from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class ProjectMember(Base):
    """프로젝트별 인력 배정 (프로젝트별 역할)"""
    __tablename__ = "project_members"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id"),
        {"schema": "common"},
    )

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("common.projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("common.users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False, default="member")  # pm | member

    project = relationship("Project", back_populates="members")
    user = relationship("User")
