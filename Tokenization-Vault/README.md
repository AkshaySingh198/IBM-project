# Tokenization + Secure Identity Vault

Part of the Zero-Exposure Fraud Investigation Copilot. This module detects and replaces PII with consistent tokens and stores the original identities securely in an encrypted vault.

## What this does

1. **Unstructured Tokenization** — detects PII inside free-form transaction text using Presidio and replaces it with tokens.

2. **Structured Tokenization** — tokenizes PII directly from structured CSV columns such as sender name, receiver name, account number, and city.

3. **Secure Vault** — maintains a persistent encrypted mapping between original identities and their tokens.

4. **API** — exposes tokenization, detokenization, and health-check endpoints through FastAPI.

## Data Flow

```text
Structured CSV ──→ structured_tokenizer.py ──→ Tokenized Data
                                               │
Free-form Text ──→ tokenizer.py ──────────────┤
                                               ↓
                                           vault.py
                                               ↓
                                      Encrypted Identity
                                           Mapping
```

Both paths use the same vault, so the same real-world value receives the same token across the system.

## Setup

```powershell
pip install -r requirements.txt
python -m spacy download en_core_web_lg
```

The repository already contains the synthetic input dataset:

`raw_transactions.csv`

The dataset contains 30 transactions with both structured fields and a free-form `transaction_text` field.

**Data generation using Faker and watchlist generation were completed during development and do not need to be repeated.**

## Run

### Unstructured data

Run the free-form text tokenizer:

```powershell
python tokenizer.py
```

Example:

```text
Aryan Maharaj sent Rs 230968 to Udant Dewan from account 1819600133 in Kishanganj.
```

becomes:

```text
PERSON_001 sent Rs 230968 to PERSON_002 from account ACCOUNT_NUMBER_001 in LOCATION_001.
```

### Structured data

Run:

```powershell
python structured_tokenizer.py
```

This processes fields such as:

```text
sender_name
receiver_name
account_number
city
```

### API

Start the FastAPI server:

```powershell
uvicorn api:app --reload
```

Docs available at:

`http://127.0.0.1:8000/docs`

## Endpoints

### POST /tokenize

Tokenizes PII in free-form text.

### POST /detokenize

Reveals the original identity for an authorized token.

### GET /health

Checks whether the API is running.

## Files

* `tokenizer.py` — unstructured/free-form PII detection and tokenization
* `structured_tokenizer.py` — structured CSV tokenization
* `overlap_resolution.py` — resolves overlapping PII detections
* `vault.py` — encrypted identity-to-token mapping
* `api.py` — FastAPI interface
* `raw_transactions.csv` — synthetic 30-row input dataset
* `tokenized_dataset.json` — pre-generated tokenized transaction output
* `token_watchlist_linkage.json` — pre-generated token/watchlist linkage output
* `TOKEN_SCHEMA.md` — token format and entity definitions
* `requirements.txt` — Python dependencies

## Generated / Local Files

The following are created locally and are **not committed to GitHub**:

* `vault.db` — local encrypted vault database
* `vault_key.key` — encryption key

The key must never be shared or committed.

Development-only testing and data-generation scripts are also not required for normal use.

## Token Format

Tokens follow:

```text
<ENTITY_TYPE>_<NUMBER>
```

Examples:

```text
PERSON_001
ACCOUNT_NUMBER_001
LOCATION_001
EMAIL_001
PHONE_NUMBER_001
```

See `TOKEN_SCHEMA.md` for the complete schema.

## Integration Notes

Downstream agents should operate on the tokenized output rather than raw PII.

The original identity values remain inside the encrypted vault and should only be accessed through the authorized detokenization flow.
