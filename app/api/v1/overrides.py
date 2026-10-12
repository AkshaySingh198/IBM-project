from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import FraudCase, Verdict, User
from app.schemas.schema_dtos import VerdictDTO
from app.api.deps import has_permission
from app.services.audit_service import create_audit_entry

class OverrideRequest(BaseModel):
    override_risk_level: str
    reason: str

router = APIRouter()

@router.post("/{case_id}/override", response_model=VerdictDTO)
def submit_case_override(
    case_id: str,
    request: OverrideRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("cases:override"))
):
    case = db.query(FraudCase).filter(FraudCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Fraud case not found")
        
    case.status = "OVERRIDDEN"
    if case.verdict:
        case.verdict.risk_level = request.override_risk_level.upper()
        case.verdict.summary = f"[ANALYST OVERRIDE by {current_user.username}] {request.reason}"
    else:
        v = Verdict(
            id=f"verd_ovr_{case.id}",
            case_id=case.id,
            risk_level=request.override_risk_level.upper(),
            summary=f"[ANALYST OVERRIDE by {current_user.username}] {request.reason}"
        )
        db.add(v)
        case.verdict = v
        
    db.commit()
    db.refresh(case.verdict)
    
    # Audit Log Entry
    create_audit_entry(
        db=db,
        actor_id=current_user.id,
        action_type="VERDICT_OVERRIDE",
        target_id=case.id
    )
    
    return case.verdict
