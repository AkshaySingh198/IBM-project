'''# Lets other parts of the project send text to your tokenizer through an API.'''

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from tokenizer import _build_analyzer, tokenize_text
from vault import Vault

app = FastAPI(title="PII Tokenization Service")

# Created once when the server starts, reused for every request.
_analyzer = _build_analyzer()
_vault = Vault()


class TokenizeRequest(BaseModel):
    text: str


class TokenizeResponse(BaseModel):
    tokenized_text: str


class DetokenizeRequest(BaseModel):
    token: str


class DetokenizeResponse(BaseModel):
    token: str
    real_value: str
    on_watchlist: bool


@app.post("/tokenize", response_model=TokenizeResponse)
def tokenize(request: TokenizeRequest) -> TokenizeResponse:
    """Takes raw text, returns the same text with PII replaced by tokens."""
    tokenized_text = tokenize_text(request.text, _analyzer, _vault)
    return TokenizeResponse(tokenized_text=tokenized_text)


@app.post("/detokenize", response_model=DetokenizeResponse)
def detokenize(request: DetokenizeRequest) -> DetokenizeResponse:
    """
    The 'Reveal Identity' endpoint. Given a token, returns the real value.
    In the full project, your teammate's backend should never let this be
    called without an audit-log entry recording who called it and why —
    that logging is the Backend teammate's job, not yours, but this is the
    function their audit-logged code will call.
    """
    real_value = _vault.get_real_value(request.token)
    if real_value is None:
        raise HTTPException(status_code=404, detail=f"Token '{request.token}' not found in vault")

    return DetokenizeResponse(
        token=request.token,
        real_value=real_value,
        on_watchlist=_vault.is_on_watchlist(request.token),
    )


@app.get("/health")
def health():
    """Simple endpoint so teammates/infra can check the service is up."""
    return {"status": "ok"}
