from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, nullable=False, index=True)
    action = Column(String(80), nullable=False)
    success = Column(Boolean, nullable=False, default=True)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    classification = Column(String(20), nullable=False, default="normal")
    confidence = Column(Integer, nullable=False, default=0)
    details = Column(Text, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    activity_id = Column(Integer, nullable=False)
    student_id = Column(Integer, nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    message = Column(String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    acknowledged = Column(Boolean, nullable=False, default=False)