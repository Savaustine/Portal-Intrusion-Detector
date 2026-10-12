from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=True, index=True)
    reg_number = Column(String(80), nullable=False, index=True)
    student_name = Column(String(150), nullable=True)
    course_code = Column(String(30), nullable=False)
    course_name = Column(String(150), nullable=False)
    grade = Column(String(10), nullable=False)
    credits = Column(Integer, nullable=False, default=3)
    semester = Column(String(50), nullable=False, default="Fall 2026")
    uploaded_by = Column(String(80), nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
