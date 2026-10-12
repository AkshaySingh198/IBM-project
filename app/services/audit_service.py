import hashlib
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.schema_models import AuditLog
from app.schemas.schema_dtos import HashVerificationResponse

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def calculate_log_hash(prev_hash: str, created_at: str, actor_id: str, action_type: str, target_id: str = None) -> str:
    payload = f"{prev_hash}|{created_at}|{actor_id}|{action_type}|{target_id or ''}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def create_audit_entry(
    db: Session,
    actor_id: str,
    action_type: str,
    target_id: str = None
) -> AuditLog:
    # Fetch latest log entry
    last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_log.hash if last_log else GENESIS_HASH
    
    created_at = datetime.now(timezone.utc).isoformat()
    curr_hash = calculate_log_hash(
        prev_hash=prev_hash,
        created_at=created_at,
        actor_id=actor_id,
        action_type=action_type,
        target_id=target_id
    )
    
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    audit_entry = AuditLog(
        id=log_id,
        actor_id=actor_id,
        action_type=action_type,
        target_id=target_id,
        prev_hash=prev_hash,
        hash=curr_hash,
        created_at=created_at
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry

def verify_audit_chain(db: Session) -> HashVerificationResponse:
    logs = db.query(AuditLog).order_by(AuditLog.created_at.asc()).all()
    if not logs:
        return HashVerificationResponse(
            total_logs=0,
            is_valid=True,
            tampered_log_id=None,
            message="Audit log is empty."
        )
    
    expected_prev_hash = GENESIS_HASH
    for log in logs:
        if log.prev_hash != expected_prev_hash:
            return HashVerificationResponse(
                total_logs=len(logs),
                is_valid=False,
                tampered_log_id=log.id,
                message=f"Hash chain broken at log ID {log.id}: prev_hash mismatch."
            )
        
        recalculated_hash = calculate_log_hash(
            prev_hash=log.prev_hash,
            created_at=log.created_at,
            actor_id=log.actor_id,
            action_type=log.action_type,
            target_id=log.target_id
        )
        if log.hash != recalculated_hash:
            return HashVerificationResponse(
                total_logs=len(logs),
                is_valid=False,
                tampered_log_id=log.id,
                message=f"Log entry tampered at log ID {log.id}: hash mismatch."
            )
        
        expected_prev_hash = log.hash
        
    return HashVerificationResponse(
        total_logs=len(logs),
        is_valid=True,
        tampered_log_id=None,
        message="Cryptographic SHA-256 hash chain is valid and untampered."
    )
