from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Dict, Any

# Authentication & User Registration
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role_name: Optional[str] = "Analyst" # Default to Analyst if omitted

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str
    permissions: List[str]

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []

class UserDTO(BaseModel):
    id: str
    username: str
    email: EmailStr
    role_id: str
    role_name: str
    permissions: List[str]
    created_at: str

    model_config = ConfigDict(from_attributes=True)

# RBAC
class PermissionDTO(BaseModel):
    id: str
    name: str

    model_config = ConfigDict(from_attributes=True)

class RoleDTO(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    permissions: List[str]

    model_config = ConfigDict(from_attributes=True)

# Tokens & Vault
class TokenEntityDTO(BaseModel):
    id: str
    token_value: str
    entity_type: str

    model_config = ConfigDict(from_attributes=True)

# Transactions, Cases, Findings, Verdicts
class TransactionDTO(BaseModel):
    id: str
    sender_token_id: str
    receiver_token_id: str
    amount: str
    txn_time: str

    model_config = ConfigDict(from_attributes=True)

class AgentFindingDTO(BaseModel):
    id: str
    case_id: str
    agent_type: str
    confidence_score: str
    summary: str

    model_config = ConfigDict(from_attributes=True)

class VerdictDTO(BaseModel):
    id: str
    case_id: str
    risk_level: str
    summary: str

    model_config = ConfigDict(from_attributes=True)

class FraudCaseDTO(BaseModel):
    id: str
    transaction_id: str
    assigned_to: Optional[str] = None
    status: str
    created_at: str
    transaction: Optional[TransactionDTO] = None
    findings: List[AgentFindingDTO] = []
    verdict: Optional[VerdictDTO] = None

    model_config = ConfigDict(from_attributes=True)

# Reveal Requests
class RevealRequestCreate(BaseModel):
    reason: str

class RevealRequestDTO(BaseModel):
    id: str
    case_id: str
    requested_by: str
    reason: str
    status: str
    approved_by: Optional[str] = None
    revealed_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class RevealApprovalResponse(BaseModel):
    request_id: str
    case_id: str
    status: str
    approved_by: str
    sender_real_value: str
    receiver_real_value: str
    audit_log_id: str
    hash: str

# Audit Log
class AuditLogDTO(BaseModel):
    id: str
    actor_id: str
    action_type: str
    target_id: Optional[str] = None
    prev_hash: str
    hash: str
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class HashVerificationResponse(BaseModel):
    total_logs: int
    is_valid: bool
    tampered_log_id: Optional[str] = None
    message: str
