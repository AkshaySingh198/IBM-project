from fastapi import FastAPI
from pydantic import BaseModel
from pattern_agent import analyze_case
from graph_agent import find_linked_flagged_tokens

app = FastAPI(title="Pattern & Graph Agent - Fraud Investigation Copilot")

class CaseInput(BaseModel):
    case_id: str
    sender: str
    receiver: str
    amount: float
    narrative: str

@app.post("/pattern-agent/analyze")
def analyze(case: CaseInput):
    result = analyze_case(case.narrative)
    return {
        "case_id": case.case_id,
        "matched_cases": result["matched_cases"],
        "flag": result["flag"],
        "explanation": result["explanation"],
        "error": result.get("error")
    }

@app.get("/graph-agent/linked/{entity_token}")
def linked_tokens(entity_token: str):
    return find_linked_flagged_tokens(entity_token)

@app.get("/")
def health_check():
    return {"status": "Pattern Agent + Graph Agent running"}