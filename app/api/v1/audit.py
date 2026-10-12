from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import AuditLog, User
from app.schemas.schema_dtos import AuditLogDTO, HashVerificationResponse
from app.api.deps import get_current_user, has_permission
from app.services.audit_service import verify_audit_chain

router = APIRouter()

@router.get("", response_model=List[AuditLogDTO])
def list_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("audit:read"))
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

@router.get("/verify", response_model=HashVerificationResponse)
def verify_hash_chain(
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("audit:read"))
):
    return verify_audit_chain(db)
