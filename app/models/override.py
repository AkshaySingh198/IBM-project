from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class CaseOverride(Base):
    __tablename__ = "overrides"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=False)
    original_risk_level = Column(String, nullable=False)
    override_risk_level = Column(String, nullable=False)
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
