from sqlalchemy import Column, Integer, String

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    reg_number = Column(String(80), unique=True, nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    username = Column(String(80), unique=True, nullable=True, index=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="student")