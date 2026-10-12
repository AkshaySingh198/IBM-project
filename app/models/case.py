from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class FraudCase(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False) # 0.0 to 1.0
    risk_level = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="OPEN", nullable=False) # OPEN, UNDER_REVIEW, RESOLVED, OVERRIDDEN
    
    # Tokenized PII fields (Safe for AI & Analysts to view)
    tokenized_subject = Column(String, nullable=False) # e.g., PERSON_8824
    tokenized_account = Column(String, nullable=False) # e.g., ACC_TOKEN_9910
    
    # Case metadata
    transaction_amount = Column(Float, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    location_token = Column(String, nullable=False) # e.g. LOC_REGION_WEST
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
