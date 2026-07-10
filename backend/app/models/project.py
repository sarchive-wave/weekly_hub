from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    sort_order = Column(Integer, default=999)
    created_at = Column(DateTime, default=datetime.utcnow)
