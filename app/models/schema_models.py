from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.session import Base

# Association Table: ROLE_PERMISSIONS
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", String, ForeignKey("permissions.id"), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String, primary_key=True, index=True) # e.g. "role_analyst", "role_admin"
    name = Column(String, unique=True, nullable=False) # Analyst, SeniorInvestigator, Auditor, Admin, ServiceAccount
    description = Column(String, nullable=True)

    users = relationship("User", back_populates="role")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String, primary_key=True, index=True) # e.g. "perm_cases_read"
    name = Column(String, unique=True, nullable=False) # e.g. "cases:read", "reveal:approve"

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(String, ForeignKey("roles.id"), nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    role = relationship("Role", back_populates="users")
    assigned_cases = relationship("FraudCase", back_populates="assignee")
    requested_reveals = relationship("RevealRequest", foreign_keys="RevealRequest.requested_by", back_populates="requester")
    approved_reveals = relationship("RevealRequest", foreign_keys="RevealRequest.approved_by", back_populates="approver")
    audit_actions = relationship("AuditLog", back_populates="actor")

class TokenEntity(Base):
    __tablename__ = "tokens"

    id = Column(String, primary_key=True, index=True)
    token_value = Column(String, unique=True, index=True, nullable=False) # e.g. PERSON_8824, ACC_TOKEN_9910
    entity_type = Column(String, nullable=False) # PERSON, ACCOUNT, LOCATION

    vault_mapping = relationship("VaultMapping", back_populates="token", uselist=False)
    watchlist_flags = relationship("WatchlistEntry", back_populates="token")

class VaultMapping(Base):
    __tablename__ = "vault_mapping"

    token_id = Column(String, ForeignKey("tokens.id"), primary_key=True)
    encrypted_value = Column(String, nullable=False) # AES-256 encrypted PII
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    token = relationship("TokenEntity", back_populates="vault_mapping")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, index=True)
    sender_token_id = Column(String, ForeignKey("tokens.id"), nullable=False)
    receiver_token_id = Column(String, ForeignKey("tokens.id"), nullable=False)
    amount = Column(String, nullable=False)
    txn_time = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    sender_token = relationship("TokenEntity", foreign_keys=[sender_token_id])
    receiver_token = relationship("TokenEntity", foreign_keys=[receiver_token_id])
    case = relationship("FraudCase", back_populates="transaction", uselist=False)

class FraudCase(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, index=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    status = Column(String, default="OPEN", nullable=False) # OPEN, UNDER_REVIEW, RESOLVED, OVERRIDDEN
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    transaction = relationship("Transaction", back_populates="case")
    assignee = relationship("User", back_populates="assigned_cases")
    agent_findings = relationship("AgentFinding", back_populates="case")
    verdict = relationship("Verdict", back_populates="case", uselist=False)
    reveal_requests = relationship("RevealRequest", back_populates="case")

class AgentFinding(Base):
    __tablename__ = "agent_findings"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    agent_type = Column(String, nullable=False) # KYC_SANCTIONS, PATTERN_RAG, BEHAVIORAL
    confidence_score = Column(String, nullable=False) # e.g. "0.92"
    summary = Column(String, nullable=False)

    case = relationship("FraudCase", back_populates="agent_findings")

class Verdict(Base):
    __tablename__ = "verdicts"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    risk_level = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    summary = Column(String, nullable=False)

    case = relationship("FraudCase", back_populates="verdict")

class WatchlistEntry(Base):
    __tablename__ = "watchlist"

    id = Column(String, primary_key=True, index=True)
    token_id = Column(String, ForeignKey("tokens.id"), nullable=False)
    list_type = Column(String, nullable=False) # OFAC_SANCTIONS, RBI_HIGH_RISK
    source = Column(String, nullable=False)

    token = relationship("TokenEntity", back_populates="watchlist_flags")

class RevealRequest(Base):
    __tablename__ = "reveal_requests"

    id = Column(String, primary_key=True, index=True)
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    requested_by = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="PENDING", nullable=False) # PENDING, APPROVED, DENIED
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    revealed_at = Column(String, nullable=True)

    case = relationship("FraudCase", back_populates="reveal_requests")
    requester = relationship("User", foreign_keys=[requested_by], back_populates="requested_reveals")
    approver = relationship("User", foreign_keys=[approved_by], back_populates="approved_reveals")

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String, primary_key=True, index=True)
    actor_id = Column(String, ForeignKey("users.id"), nullable=False)
    action_type = Column(String, nullable=False) # LOGIN, REVEAL_REQUEST, REVEAL_APPROVE, VERDICT_OVERRIDE, AUDIT_EXPORT
    target_id = Column(String, nullable=True)
    prev_hash = Column(String, nullable=False)
    hash = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    actor = relationship("User", back_populates="audit_actions")
