from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from app.database import Base


class UserProjectOrder(Base):
    """사용자별 프로젝트 표시 순서(개인화). 없으면 가나다 기본."""
    __tablename__ = "user_project_order"
    __table_args__ = (
        UniqueConstraint("user_id", "project_id"),
        {"schema": "common"},
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("common.users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("common.projects.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, nullable=False)
