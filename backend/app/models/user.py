from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "common"}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(10), nullable=False, default="user")  # 전역역할: admin | user
    display_name = Column(String(50), nullable=False)
    position = Column(String(50))  # 직책
    team = Column(String(50))      # 소속/팀
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, default=999)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
