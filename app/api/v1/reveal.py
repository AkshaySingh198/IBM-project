from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.case import FraudCase
from app.models.user import User, UserRole
from app.schemas.audit import RevealRequest, RevealResponse
from app.api.deps import get_current_user, require_role
from app.services.audit_service import create_audit_entry
from app.services.ml_client import ml_client

router = APIRouter()

@router.post("/{case_id}/reveal", response_model=RevealResponse)
async def reveal_identity(
    case_id: int,
    request: RevealRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.SENIOR_INVESTIGATOR.value]))
):
    if not request.detailed_reason or len(request.detailed_reason.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid detailed justification (at least 10 characters) is required for identity reveal."
        )

    case = db.query(FraudCase).filter(FraudCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Fraud case not found")
        
    # Call ML1 Detokenization service or Standalone Vault Stub
    detokenized_info = await ml_client.detokenize_entity(
        tokenized_subject=case.tokenized_subject,
        tokenized_account=case.tokenized_account
    )
    
    # Format audit log justification string
    full_justification = f"Category: {request.justification_category} | Details: {request.detailed_reason}"
    
    # Append to Cryptographic Audit Log
    audit_entry = create_audit_entry(
        db=db,
        user_id=current_user.id,
        user_email=current_user.email,
        user_role=current_user.role,
        action="IDENTITY_REVEAL",
        case_id=case.id,
        justification=full_justification
    )
    
    return {
        "case_id": case.id,
        "tokenized_subject": case.tokenized_subject,
        "real_name": detokenized_info["real_name"],
        "tokenized_account": case.tokenized_account,
        "real_account_number": detokenized_info["real_account_number"],
        "revealed_by": f"{current_user.full_name} ({current_user.role})",
        "audit_log_id": audit_entry.id,
        "log_hash": audit_entry.current_hash
    }
