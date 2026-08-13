from sqlalchemy import Column, Integer, String, Boolean, UniqueConstraint
from app.database import Base


class RolePermission(Base):
    """역할별 권한 설정(시스템 관리). role: admin|pm|member"""
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint("role", "permission"),)

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False)
    permission = Column(String(50), nullable=False)
    enabled = Column(Boolean, nullable=False, default=False)
