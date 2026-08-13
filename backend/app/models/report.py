from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    week_id = Column(Integer, ForeignKey("weekly.weeks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("common.users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(10), nullable=False, default="none")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    week = relationship("Week", back_populates="reports")
    entries = relationship("ReportEntry", back_populates="report", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("week_id", "user_id"), {"schema": "weekly"})


class ReportEntry(Base):
    __tablename__ = "report_entries"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("weekly.reports.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("common.projects.id", ondelete="CASCADE"), nullable=False)
    current_work = Column(String, default="")
    next_work = Column(String, default="")

    report = relationship("Report", back_populates="entries")

    __table_args__ = (UniqueConstraint("report_id", "project_id"), {"schema": "weekly"})
