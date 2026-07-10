from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Week(Base):
    __tablename__ = "weeks"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    week_num = Column(Integer, nullable=False)
    title = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    reports = relationship("Report", back_populates="week", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("year", "month", "week_num"),)
