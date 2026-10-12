from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class RevealRequest(BaseModel):
    justification_category: str
    detailed_reason: str

class RevealResponse(BaseModel):
    case_id: int
    tokenized_subject: str
    real_name: str
    tokenized_account: str
    real_account_number: str
    revealed_by: str
    audit_log_id: int
    log_hash: str

class AuditLogEntry(BaseModel):
    id: int
    timestamp: str
    user_id: int
    user_email: str
    user_role: str
    action: str
    case_id: Optional[int] = None
    justification: Optional[str] = None
    previous_hash: str
    current_hash: str

    model_config = ConfigDict(from_attributes=True)

class HashVerificationResponse(BaseModel):
    total_logs: int
    is_valid: bool
    tampered_log_id: Optional[int] = None
    message: str
