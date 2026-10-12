from pydantic import BaseModel, ConfigDict
from datetime import datetime

class OverrideCreate(BaseModel):
    override_risk_level: str
    reason: str

class OverrideResponse(BaseModel):
    id: int
    case_id: int
    user_id: int
    original_risk_level: str
    override_risk_level: str
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
