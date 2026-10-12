import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import FraudCase, RevealRequest, VaultMapping, User, Transaction, TokenEntity
from app.schemas.schema_dtos import (
    RevealRequestCreate, RevealRequestDTO, RevealApprovalResponse
)
from app.api.deps import get_current_user, has_permission
from app.core.vault_crypto import decrypt_pii
from app.services.audit_service import create_audit_entry

router = APIRouter()

def find_case_by_flexible_id(case_id: str, db: Session) -> Optional[FraudCase]:
    # 1. Direct match by case.id (e.g. "case_1")
    case = db.query(FraudCase).filter(FraudCase.id == case_id).first()
    if case:
        return case
        
    # 2. Match by transaction_id (e.g. "txn_101")
    case = db.query(FraudCase).filter(FraudCase.transaction_id == case_id).first()
    if case:
        return case
        
    # 3. Match by token_value (e.g. "PERSON_001", "ACCOUNT_NUMBER_001") or token_id
    case = (
        db.query(FraudCase)
        .join(Transaction, FraudCase.transaction_id == Transaction.id)
        .join(TokenEntity, (Transaction.sender_token_id == TokenEntity.id) | (Transaction.receiver_token_id == TokenEntity.id))
        .filter((TokenEntity.token_value == case_id) | (TokenEntity.id == case_id))
        .first()
    )
    if case:
        return case

    # 4. Match by real value in VaultMapping (e.g. account number "1819600133")
    vault_entries = db.query(VaultMapping).all()
    for vm in vault_entries:
        try:
            real_val = decrypt_pii(vm.encrypted_value)
            if real_val == case_id:
                # Find case linked to this token
                matched_case = (
                    db.query(FraudCase)
                    .join(Transaction, FraudCase.transaction_id == Transaction.id)
                    .filter((Transaction.sender_token_id == vm.token_id) | (Transaction.receiver_token_id == vm.token_id))
                    .first()
                )
                if matched_case:
                    return matched_case
        except Exception:
            continue

    return None

@router.post("/cases/{case_id}/reveal-requests", response_model=RevealRequestDTO, status_code=status.HTTP_201_CREATED)
def submit_reveal_request(
    case_id: str,
    request_data: RevealRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("reveal:request"))
):
    # Specific check for empty reason in request body
    if not request_data.reason or not request_data.reason.strip():
        raise HTTPException(
            status_code=400,
            detail="The 'reason' field in the request body cannot be empty. Please provide a reason for the reveal request (e.g. 'audit check' or 'fiu escalation')."
        )

    case = find_case_by_flexible_id(case_id, db)
    if not case:
        available_cases = [c.id for c in db.query(FraudCase.id).all()]
        raise HTTPException(
            status_code=404,
            detail=f"Fraud case '{case_id}' not found. Available case IDs are: {', '.join(available_cases)}."
        )
        
    req_id = f"rev_req_{uuid.uuid4().hex[:8]}"
    reveal_req = RevealRequest(
        id=req_id,
        case_id=case.id,
        requested_by=current_user.id,
        reason=request_data.reason.strip(),
        status="PENDING"
    )
    db.add(reveal_req)
    db.commit()
    db.refresh(reveal_req)
    
    # Audit log entry for request creation
    create_audit_entry(
        db=db,
        actor_id=current_user.id,
        action_type="REVEAL_REQUEST_SUBMITTED",
        target_id=reveal_req.id
    )
    
    return reveal_req

@router.get("/reveal-requests", response_model=List[RevealRequestDTO])
def list_reveal_requests(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("cases:read"))
):
    query = db.query(RevealRequest)
    if status_filter:
        query = query.filter(RevealRequest.status == status_filter.upper())
    return query.all()

@router.post("/reveal-requests/{request_id}/approve", response_model=RevealApprovalResponse)
def approve_reveal_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("reveal:approve"))
):
    # Security Rule 1: Admin is prohibited from approving reveal requests
    if current_user.role.name == "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Violation: System Admin role is explicitly prohibited from approving identity reveal requests (Separation of Duties)."
        )

    reveal_req = db.query(RevealRequest).filter(RevealRequest.id == request_id).first()
    if not reveal_req:
        raise HTTPException(status_code=404, detail=f"Reveal request '{request_id}' not found.")
        
    if reveal_req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Cannot approve reveal request with status '{reveal_req.status}'. Must be PENDING.")

    # Security Rule 2: Prevent Self-Approval
    if reveal_req.requested_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Security Violation: Investigators cannot approve their own identity reveal requests."
        )

    case = reveal_req.case
    if not case or not case.transaction:
        raise HTTPException(status_code=404, detail="Linked transaction or case not found.")
        
    # Query Vault Mappings (Isolated datastore query)
    sender_vault = db.query(VaultMapping).filter(VaultMapping.token_id == case.transaction.sender_token_id).first()
    receiver_vault = db.query(VaultMapping).filter(VaultMapping.token_id == case.transaction.receiver_token_id).first()
    
    sender_real = decrypt_pii(sender_vault.encrypted_value) if sender_vault else "[Unknown Sender]"
    receiver_real = decrypt_pii(receiver_vault.encrypted_value) if receiver_vault else "[Unknown Receiver]"
    
    # Update Reveal Request Status
    now_iso = datetime.now(timezone.utc).isoformat()
    reveal_req.status = "APPROVED"
    reveal_req.approved_by = current_user.id
    reveal_req.revealed_at = now_iso
    db.commit()
    
    # Record SHA-256 Hash-Chained Audit Log
    audit_entry = create_audit_entry(
        db=db,
        actor_id=current_user.id,
        action_type="REVEAL_APPROVED",
        target_id=reveal_req.id
    )
    
    return {
        "request_id": reveal_req.id,
        "case_id": case.id,
        "status": "APPROVED",
        "approved_by": f"{current_user.username} ({current_user.role.name})",
        "sender_real_value": sender_real,
        "receiver_real_value": receiver_real,
        "audit_log_id": audit_entry.id,
        "hash": audit_entry.hash
    }

@router.post("/reveal-requests/{request_id}/deny", response_model=RevealRequestDTO)
def deny_reveal_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("reveal:approve"))
):
    reveal_req = db.query(RevealRequest).filter(RevealRequest.id == request_id).first()
    if not reveal_req:
        raise HTTPException(status_code=404, detail=f"Reveal request '{request_id}' not found.")
        
    if reveal_req.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Cannot deny reveal request with status '{reveal_req.status}'. Must be PENDING.")

    reveal_req.status = "DENIED"
    reveal_req.approved_by = current_user.id
    reveal_req.revealed_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    
    # Audit Log
    create_audit_entry(
        db=db,
        actor_id=current_user.id,
        action_type="REVEAL_DENIED",
        target_id=reveal_req.id
    )
    
    return reveal_req
