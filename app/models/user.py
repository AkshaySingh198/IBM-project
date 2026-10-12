from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    ANALYST = "ANALYST"
    SENIOR_INVESTIGATOR = "SENIOR_INVESTIGATOR"
    AUDITOR = "AUDITOR"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.ANALYST.value, nullable=False)
    is_active = Column(Boolean, default=True)
