from fastapi import FastAPI
from pydantic import BaseModel
from pattern_agent import analyze_case

app = FastAPI()

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
        "flag": result["flag"]
    }

@app.get("/")
def health_check():
    return {"status": "Pattern Agent is running"}