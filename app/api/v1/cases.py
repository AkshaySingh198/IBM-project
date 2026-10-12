from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.schema_models import FraudCase, User
from app.schemas.schema_dtos import FraudCaseDTO
from app.api.deps import get_current_user, has_permission

router = APIRouter()

@router.get("", response_model=List[FraudCaseDTO])
def list_cases(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("cases:read"))
):
    query = db.query(FraudCase)
    if status_filter:
        query = query.filter(FraudCase.status == status_filter.upper())
    cases = query.all()
    
    result = []
    for c in cases:
        result.append({
            "id": c.id,
            "transaction_id": c.transaction_id,
            "assigned_to": c.assigned_to,
            "status": c.status,
            "created_at": c.created_at,
            "transaction": {
                "id": c.transaction.id,
                "sender_token_id": c.transaction.sender_token_id,
                "receiver_token_id": c.transaction.receiver_token_id,
                "amount": c.transaction.amount,
                "txn_time": c.transaction.txn_time
            } if c.transaction else None,
            "findings": [
                {
                    "id": f.id,
                    "case_id": f.case_id,
                    "agent_type": f.agent_type,
                    "confidence_score": f.confidence_score,
                    "summary": f.summary
                } for f in c.agent_findings
            ],
            "verdict": {
                "id": c.verdict.id,
                "case_id": c.verdict.case_id,
                "risk_level": c.verdict.risk_level,
                "summary": c.verdict.summary
            } if c.verdict else None
        })
    return result

@router.get("/{case_id}", response_model=FraudCaseDTO)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(has_permission("cases:read"))
):
    c = db.query(FraudCase).filter(FraudCase.id == case_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Fraud case not found")
        
    return {
        "id": c.id,
        "transaction_id": c.transaction_id,
        "assigned_to": c.assigned_to,
        "status": c.status,
        "created_at": c.created_at,
        "transaction": {
            "id": c.transaction.id,
            "sender_token_id": c.transaction.sender_token_id,
            "receiver_token_id": c.transaction.receiver_token_id,
            "amount": c.transaction.amount,
            "txn_time": c.transaction.txn_time
        } if c.transaction else None,
        "findings": [
            {
                "id": f.id,
                "case_id": f.case_id,
                "agent_type": f.agent_type,
                "confidence_score": f.confidence_score,
                "summary": f.summary
            } for f in c.agent_findings
        ],
        "verdict": {
            "id": c.verdict.id,
            "case_id": c.verdict.case_id,
            "risk_level": c.verdict.risk_level,
            "summary": c.verdict.summary
        } if c.verdict else None
    }
