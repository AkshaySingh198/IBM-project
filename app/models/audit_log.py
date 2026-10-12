from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from app.db.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, nullable=False) # ISO formatted timestamp
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    user_role = Column(String, nullable=False)
    action = Column(String, nullable=False) # IDENTITY_REVEAL, VERDICT_OVERRIDE, LOGIN, AUDIT_EXPORT
    case_id = Column(Integer, nullable=True)
    justification = Column(String, nullable=True)
    
    # Cryptographic Hash Chaining fields
    previous_hash = Column(String, nullable=False)
    current_hash = Column(String, nullable=False)
