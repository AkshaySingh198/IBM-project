from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List, Dict, Any

class CaseSummary(BaseModel):
    id: int
    case_number: str
    title: str
    risk_score: float
    risk_level: str
    status: str
    tokenized_subject: str
    tokenized_account: str
    transaction_amount: float
    currency: str
    location_token: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AgentFactor(BaseModel):
    agent_name: str
    score: float
    finding: str
    weight: float

class MultiAgentInvestigation(BaseModel):
    case_id: int
    tokenized_subject: str
    kyc_sanctions_check: Dict[str, Any]
    pattern_rag_check: Dict[str, Any]
    behavioral_check: Dict[str, Any]
    aggregator_verdict: Dict[str, Any]
    agent_breakdown: List[AgentFactor]

class CaseDetailResponse(BaseModel):
    case: CaseSummary
    investigation: MultiAgentInvestigation
