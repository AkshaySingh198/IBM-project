# FRONTEND_HANDOFF.md: Technical Architecture & API Contract Report

## 1. Repository File Tree & Purpose Overview

```text
IBM-project/
├── .github/
│   └── workflows/
│       ├── integration.yml        # CI pipeline: builds ChromaDB, tests pattern agent & aggregator
│       └── test.yml               # CI pipeline: runs aggregator scoring unit tests
├── Tokenization-Vault/            # ML1: PII detection, tokenization engine, and AES-encrypted vault
│   ├── data/                      # Raw transactions, tokenized datasets, and watchlist linkages
│   ├── docs/TOKEN_SCHEMA.md       # Token format specification (<ENTITY>_<3-digits>)
│   └── src/
│       ├── api.py                 # FastAPI service for /tokenize and /detokenize (reveal)
│       ├── vault.py               # SQLite + Fernet encrypted vault storage
│       ├── tokenizer.py           # Presidio analyzer and regex tokenization
│       ├── structured_tokenizer.py # Tabular CSV tokenizer preserving links
│       └── overlap_resolution.py  # Conflict resolution for overlapping text spans
├── pattern-agent/                 # ML2: Vector similarity search (RAG) & graph ring detection
│   ├── main.py                    # FastAPI service: /pattern-agent/analyze & /graph-agent/linked
│   ├── pattern_agent.py           # ChromaDB search with SentenceTransformer embeddings
│   ├── graph_agent.py             # NetworkX graph analysis detecting multi-hop rings
│   ├── build_index.py             # ChromaDB index builder for historical fraud cases
│   ├── fake_data.py               # Mock historical fraud dataset (10 cases)
│   └── real_transactions.json     # Sample transaction dataset
├── kyc-behavioral-agent/          # ML3: Watchlist sanctions screening & behavioral anomaly detector
│   ├── ml_person3_agents.py       # Active module: IsolationForest model & RapidFuzz KYC check
│   ├── ml_person3_agents-1.py     # Alternative variant reading token_watchlist_linkage.json
│   ├── generate_behavioral_data.py # Synthetic behavioral metrics generator
│   └── behavioral_training_data.csv # Training data for Isolation Forest model
├── aggregator/                    # ML4: Risk scoring aggregator and decision engine
│   ├── aggregator.py              # Combines agent signals into composite score & verdict
│   ├── integration_test.py        # End-to-end multi-agent test runner
│   └── test_aggregator.py         # Unit test suite verifying risk heuristics
├── app/                           # Backend (Person 5): Governance, RBAC, Gated Reveal & Audit API
│   ├── main.py                    # FastAPI entrypoint, CORS configuration, lifespan startup
│   ├── api/
│   │   ├── deps.py                # JWT authentication dependencies & permission checkers
│   │   └── v1/
│   │       ├── auth.py            # /register, /login, /me endpoints
│   │       ├── cases.py           # /cases listing and detailed case view
│   │       ├── reveal_requests.py # Gated identity reveal lifecycle (/submit, /approve, /deny)
│   │       ├── overrides.py       # Analyst risk level override endpoint
│   │       ├── audit.py           # Audit log listing and SHA-256 chain verification
│   │       ├── reports.py         # PDF and CSV compliance report export
│   │       ├── roles.py           # RBAC role and permission inspection
│   │       └── reveal.py          # [ORPHANED] Unrouted legacy reveal endpoint
│   ├── core/
│   │   ├── config.py              # Pydantic Settings (secrets, token expiration, service URLs)
│   │   ├── security.py            # Bcrypt hashing and JWT generation/validation
│   │   └── vault_crypto.py        # Fernet AES-256 encryption/decryption for backend vault mapping
│   ├── db/
│   │   ├── session.py             # SQLAlchemy session factory (SQLite)
│   │   └── init_db.py             # 13-table schema creator, RBAC seeder, demo data generator
│   ├── models/
│   │   ├── schema_models.py       # Active 13-table normalized schema (SQLAlchemy)
│   │   └── (audit_log, case, override, user).py # [LEGACY] V0 standalone models (superseded)
│   ├── schemas/
│   │   ├── schema_dtos.py         # Active Pydantic DTOs for requests and responses
│   │   └── (audit, auth, case, override).py # [LEGACY] V0 standalone schemas (superseded)
│   └── services/
│       ├── audit_service.py       # SHA-256 hash chaining and chain integrity validation
│       ├── report_service.py      # FPDF2 and CSV export generation
│       └── ml_client.py           # HTTP client & fallback stubs for ML1 and ML4
├── tests/                         # Automated backend test suite (14 passing tests)
├── requirements.txt               # Backend dependencies (FastAPI, SQLAlchemy, PyJWT, FPDF2, etc.)
└── openapi.json                   # Exported OpenAPI 3.1.0 schema for frontend code generation
```

---

## 2. Execution Guide & Service Dependencies

### Service Topology
```
[React Frontend] (Port 3000 / 5173)
       │ (HTTP / Bearer JWT)
       ▼
[Backend: app] (Port 8000) ── SQLite (sql_app.db)
       ├── [Tokenization-Vault: ML1] (Port 8002) [Optional in Stub Mode]
       └── [Pattern & Graph Agent: ML2] (Port 8003)
                    └── [ChromaDB + NetworkX]
```
*Note: Person 3 (KYC/Behavioral) and Person 4 (Aggregator) are Python modules, not HTTP services. In default stub mode (`USE_ML_STUBS=True`), `app` runs completely self-contained.*

### Environment Variables Needed
- `PROJECT_NAME`: Title string for the OpenAPI documentation
- `API_V1_STR`: API route prefix (`/api/v1`)
- `SECRET_KEY`: Hex string used for JWT signature and Fernet vault key derivation (`[REDACTED]`)
- `ALGORITHM`: JWT signing algorithm (`HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT token lifetime in minutes (`1440`)
- `DATABASE_URL`: SQLAlchemy connection URL (`sqlite:///./sql_app.db`)
- `USE_ML_STUBS`: Boolean switch toggling live ML microservices vs. internal database stubs (`True`)
- `ML1_VAULT_URL`: Tokenization Vault HTTP base URL (`http://localhost:8001`)
- `ML4_ORCHESTRATOR_URL`: Aggregator orchestrator HTTP base URL (`http://localhost:8004`)

### Start Commands
There is **no docker-compose or unified startup script**. Services must be run separately:

1. **Backend (`app`):**
   ```bash
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Pattern Agent (`pattern-agent`):**
   ```bash
   cd pattern-agent && pip install -r requirements.txt
   python build_index.py
   uvicorn main:app --host 0.0.0.0 --port 8003 --reload
   ```
3. **Tokenization Vault (`Tokenization-Vault`):**
   ```bash
   cd Tokenization-Vault && pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   cd src && uvicorn api:app --host 0.0.0.0 --port 8002 --reload
   ```

---

## 3. API Contract Reference

Base URL: `http://localhost:8000/api/v1`

### A. Authentication & RBAC (`app/api/v1/auth.py`, `roles.py`)

#### `POST /api/v1/auth/register`
- **Purpose:** Registers a new user. Emits `USER_REGISTER` audit log.
- **Auth:** Public.
- **Request:**
  ```json
  {"username": "jdoe", "email": "jdoe@bank.com", "password": "Password123!", "role_name": "Analyst"}
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "user_a1b2c3d4",
    "username": "jdoe",
    "email": "jdoe@bank.com",
    "role_id": "role_analyst",
    "role_name": "Analyst",
    "permissions": ["cases:override", "cases:read", "reveal:request"],
    "created_at": "2026-10-13T06:30:00.000000+00:00"
  }
  ```
- **Errors:** `400 Bad Request` (`User with this email already exists`, `Username is already taken`, `Invalid role name`).

#### `POST /api/v1/auth/login`
- **Purpose:** Logs in user via JSON or form-data. Emits `LOGIN` audit log.
- **Auth:** Public.
- **Request:**
  ```json
  {"email": "analyst@bank.com", "password": "password123"}
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "user_id": "user_analyst",
    "username": "analyst",
    "role": "Analyst",
    "permissions": ["cases:override", "cases:read", "reveal:request"]
  }
  ```
- **Errors:** `400 Bad Request` (missing fields), `401 Unauthorized` (`Incorrect email/username or password`).

#### `GET /api/v1/auth/me`
- **Purpose:** Returns authenticated user profile.
- **Auth:** `Authorization: Bearer <token>`.
- **Response (200 OK):** `UserDTO` object matching the `/register` response shape.
- **Errors:** `401 Unauthorized`.

#### `GET /api/v1/roles` & `GET /api/v1/permissions`
- **Purpose:** List roles and assigned permissions (`GET /roles` requires `roles:manage`; `GET /permissions` requires any authenticated user).
- **Response (200 OK):**
  ```json
  [{"id": "role_analyst", "name": "Analyst", "description": "...", "permissions": ["cases:read", "cases:override", "reveal:request"]}]
  ```

---

### B. Fraud Cases & Overrides (`app/api/v1/cases.py`, `overrides.py`)

#### `GET /api/v1/cases`
- **Purpose:** List cases. Optional query: `status_filter` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`, `OVERRIDDEN`).
- **Auth:** `Authorization: Bearer <token>` (Permission: `cases:read`).
- **Response (200 OK):**
  ```json
  [
    {
      "id": "case_1",
      "transaction_id": "txn_101",
      "assigned_to": "user_analyst",
      "status": "OPEN",
      "created_at": "2026-10-13T06:33:32.693749+00:00",
      "transaction": {
        "id": "txn_101",
        "sender_token_id": "tok_subj_1",
        "receiver_token_id": "tok_acc_1",
        "amount": "230968.00",
        "txn_time": "2026-10-13T06:33:32.688357+00:00"
      },
      "findings": [
        {
          "id": "af_1",
          "case_id": "case_1",
          "agent_type": "KYC_AGENT",
          "confidence_score": "0.95",
          "summary": "Matches RBI High-Risk Watchlist entry for PERSON_001."
        }
      ],
      "verdict": {
        "id": "verd_1",
        "case_id": "case_1",
        "risk_level": "HIGH",
        "summary": "Composite Risk Score: 90/100 (HIGH). Multiple signals: Pattern Flag + KYC Match + Behavioral Anomaly + Graph Ring."
      }
    }
  ]
  ```

#### `GET /api/v1/cases/{case_id}`
- **Purpose:** Detailed view of single case.
- **Auth:** `Authorization: Bearer <token>` (Permission: `cases:read`).
- **Response (200 OK):** Single `FraudCaseDTO` object.
- **Errors:** `404 Not Found` (`{"detail": "Fraud case not found"}`).

#### `POST /api/v1/cases/{case_id}/override`
- **Purpose:** Analyst manual override of risk level. Sets status to `OVERRIDDEN` and records an audit log.
- **Auth:** `Authorization: Bearer <token>` (Permission: `cases:override`).
- **Request:**
  ```json
  {"override_risk_level": "LOW", "reason": "Customer confirmed travel plan; false positive jump."}
  ```
- **Response (200 OK):**
  ```json
  {
    "id": "verd_2",
    "case_id": "case_2",
    "risk_level": "LOW",
    "summary": "[ANALYST OVERRIDE by analyst] Customer confirmed travel plan; false positive jump."
  }
  ```
- **Errors:** `404 Not Found`.

---

### C. Gated Identity Reveal Lifecycle (`app/api/v1/reveal_requests.py`)

#### `POST /api/v1/cases/{case_id}/reveal-requests`
- **Purpose:** Submits gated request to reveal masked identities. `{case_id}` supports Case ID, Transaction ID, Token value (`PERSON_001`), or raw account number.
- **Auth:** `Authorization: Bearer <token>` (Permission: `reveal:request`).
- **Request:**
  ```json
  {"reason": "Customer matched RBI high-risk watchlist; escalation to FIU required."}
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "rev_req_4472eeae",
    "case_id": "case_1",
    "requested_by": "user_analyst",
    "reason": "Customer matched RBI high-risk watchlist; escalation to FIU required.",
    "status": "PENDING",
    "approved_by": null,
    "revealed_at": null
  }
  ```
- **Errors:** `400 Bad Request` (empty reason), `404 Not Found`.

#### `GET /api/v1/reveal-requests`
- **Purpose:** Lists reveal requests. Optional query: `status_filter` (`PENDING`, `APPROVED`, `DENIED`).
- **Auth:** `Authorization: Bearer <token>` (Permission: `cases:read`).
- **Response (200 OK):** Array of `RevealRequestDTO` objects.

#### `POST /api/v1/reveal-requests/{request_id}/approve`
- **Purpose:** Dual-control approval. Decrypts vault AES-256 PII and links to a SHA-256 audit log.
- **Security Rules:**
  1. Admin role is prohibited (403 Forbidden).
  2. Approver cannot be the requester (400 Bad Request).
- **Auth:** `Authorization: Bearer <token>` (Permission: `reveal:approve`, e.g. SeniorInvestigator).
- **Response (200 OK):**
  ```json
  {
    "request_id": "rev_req_4472eeae",
    "case_id": "case_1",
    "status": "APPROVED",
    "approved_by": "investigator (SeniorInvestigator)",
    "sender_real_value": "Aryan Maharaj",
    "receiver_real_value": "1819600133",
    "audit_log_id": "log_07d1677f",
    "hash": "c8ed9154a665eafc0bfac43aef357ac3578009cec0498665748f35e69b4f6d7c"
  }
  ```
- **Errors:** `400 Bad Request` (self-approval or status != PENDING), `403 Forbidden`, `404 Not Found`.

#### `POST /api/v1/reveal-requests/{request_id}/deny`
- **Purpose:** Rejects reveal request.
- **Auth:** `Authorization: Bearer <token>` (Permission: `reveal:approve`).
- **Response (200 OK):** `RevealRequestDTO` with status `DENIED`.

---

### D. Audit Logs & Reports (`app/api/v1/audit.py`, `reports.py`)

#### `GET /api/v1/audit-logs`
- **Purpose:** Lists tamper-evident audit logs.
- **Auth:** `Authorization: Bearer <token>` (Permission: `audit:read`).
- **Response (200 OK):**
  ```json
  [
    {
      "id": "log_07d1677f",
      "actor_id": "user_investigator",
      "action_type": "REVEAL_APPROVED",
      "target_id": "rev_req_4472eeae",
      "prev_hash": "24699a221f78631eb04031df33aa4795e1eb24e4d775ea087cb8df6d0d7eeb35",
      "hash": "c8ed9154a665eafc0bfac43aef357ac3578009cec0498665748f35e69b4f6d7c",
      "created_at": "2026-10-13T06:35:05.123456+00:00"
    }
  ]
  ```

#### `GET /api/v1/audit-logs/verify`
- **Purpose:** Cryptographically verifies entire SHA-256 hash chain from genesis block to current head.
- **Auth:** `Authorization: Bearer <token>` (Permission: `audit:read`).
- **Response (200 OK):**
  ```json
  {
    "total_logs": 6,
    "is_valid": true,
    "tampered_log_id": null,
    "message": "Cryptographic SHA-256 hash chain is valid and untampered."
  }
  ```

#### `GET /api/v1/reports/compliance`
- **Purpose:** Generates downloadable audit report.
- **Query Params:** `format` (`pdf` or `csv`, default: `pdf`).
- **Auth:** `Authorization: Bearer <token>` (Permission: `audit:export`).
- **Response (200 OK):** Binary file stream with `Content-Disposition: attachment; filename=compliance_audit_report.{pdf|csv}`.

---

### E. Microservice Endpoints (ML1 & ML2)

#### Tokenization Vault (`Tokenization-Vault/src/api.py` on Port 8002)
- `POST /tokenize`: `{"text": str}` $\rightarrow$ `{"tokenized_text": str}` (Public)
- `POST /detokenize`: `{"token": str}` $\rightarrow$ `{"token": str, "real_value": str, "on_watchlist": bool}` (Public)
- `GET /health`: `{"status": "ok"}`

#### Pattern & Graph Agent (`pattern-agent/main.py` on Port 8003)
- `POST /pattern-agent/analyze`:
  - Request: `{"case_id": str, "sender": str, "receiver": str, "amount": float, "narrative": str}`
  - Response:
    ```json
    {
      "case_id": "TEST_001",
      "matched_cases": [{"case_id": "FAKE_001", "similarity_percent": 84.2, "narrative": "...", "amount": 45000.0}],
      "flag": true,
      "explanation": "Flagged: this transaction closely resembles FAKE_001...",
      "error": null
    }
    ```
- `GET /graph-agent/linked/{entity_token}`:
  - Response:
    ```json
    {"entity_token": "PERSON_001", "linked_tokens": ["PERSON_002", "PERSON_045"], "ring_size": 2, "error": null}
    ```

---

## 4. Multi-Agent Data Shapes & Verdict Schema

### 1. Pattern Agent
- `case_id` (`str`): `"TEST_001"`
- `matched_cases` (`list[dict]`): Top $k$ matches with `case_id` (`str`), `similarity_percent` (`float`), `narrative` (`str`), `amount` (`float`)
- `flag` (`bool`): `true` if top similarity $> 55\%$
- `explanation` (`str`): Human-readable rationale generated by RAG engine
- `error` (`str | null`): `null`

### 2. Graph Agent
- `entity_token` (`str`): `"PERSON_001"`
- `linked_tokens` (`list[str]`): `["PERSON_002", "PERSON_045"]`
- `ring_size` (`int`): `2`
- `error` (`str | null`): `null`

### 3. KYC / Sanctions Agent
- `match_found` (`bool`): `true`
- `matched_entity` (`str | null`): `"PERSON_001"`
- `similarity_score` (`float`): `100.0`
- `verdict` (`str`): `"WATCHLIST MATCH - PERSON_001"`

### 4. Behavioral Agent
- `is_anomaly` (`bool`): `true`
- `anomaly_score` (`float`): `-0.1425`
- `verdict` (`str`): `"FLAGGED - unusual transaction pattern"`

### 5. Final Aggregator Verdict Object
```json
{
  "entity_token": "PERSON_001",
  "risk_score": 90,
  "risk_level": "HIGH",
  "score_type": "Demo heuristic; not a validated fraud probability",
  "signals": {
    "pattern_flag": true,
    "pattern_explanation": "Flagged: this transaction closely resembles FAKE_001...",
    "graph_ring_size": 2,
    "linked_tokens": ["PERSON_002", "PERSON_045"],
    "kyc_match": true,
    "kyc_verdict": "WATCHLIST MATCH - PERSON_001",
    "behavioral_anomaly": true,
    "behavioral_verdict": "FLAGGED - unusual transaction pattern"
  },
  "evidence": [
    {"source": "Pattern Agent", "finding": "Flagged: resembles FAKE_001 (82.5% similarity)"},
    {"source": "Graph Agent", "finding": "2 linked entities detected", "linked_tokens": ["PERSON_002", "PERSON_045"]},
    {"source": "KYC Agent", "finding": "WATCHLIST MATCH - PERSON_001"},
    {"source": "Behavioral Agent", "finding": "FLAGGED - unusual transaction pattern"}
  ],
  "recommended_next_action": "Prioritize human investigator review",
  "human_review_required": true
}
```

*Scoring Matrix Rules:*
- Pattern Flag: $+30$
- KYC Match: $+30$
- Behavioral Anomaly: $+30$
- Graph Ring Size $> 0$: $+10$
- Score $\ge 60 \rightarrow$ `HIGH`, $\ge 30 \rightarrow$ `MEDIUM`, $< 30 \rightarrow$ `LOW`.

---

## 5. Tokenization & Vault Specifications

### Token Formats
Tokens follow `<ENTITY_TYPE>_<3-DIGIT_PADDED_INDEX>`:
- `PERSON_001`, `ACCOUNT_NUMBER_001`, `LOCATION_001`, `DEVICE_ID_001`, `IP_ADDRESS_001`, `EMAIL_001`

### Tokenize / Detokenize Contract
- **Tokenize (`POST /tokenize`):**
  - Request: `{"text": "Transfer from Rahul Sharma in Patna"}`
  - Response: `{"tokenized_text": "Transfer from PERSON_001 in LOCATION_001"}`
- **Detokenize (`POST /detokenize`):**
  - Request: `{"token": "PERSON_001"}`
  - Response: `{"token": "PERSON_001", "real_value": "Rahul Sharma", "on_watchlist": true}`

### Gated Reveal Workflow
1. **Analyst Submission:** Calls `POST /api/v1/cases/{case_id}/reveal-requests` with a mandatory reason. Status: `PENDING`.
2. **Dual-Control Approval:** A different user with `SeniorInvestigator` role calls `POST /api/v1/reveal-requests/{request_id}/approve`.
3. **Hard Safeguards:** Admins are blocked (403); self-approval is blocked (400).
4. **Result:** PII decrypted from `vault_mapping` using AES-256 Fernet; status changed to `APPROVED`; cryptographic audit record written.

---

## 6. Cryptographic Audit Trail

### Storage & Schema
Table `audit_log` in SQLite:
- `id`: Unique string (`log_<8-hex-chars>`)
- `actor_id`: User performing action (`user_analyst`)
- `action_type`: `SYSTEM_INIT`, `USER_REGISTER`, `LOGIN`, `REVEAL_REQUEST_SUBMITTED`, `REVEAL_APPROVED`, `REVEAL_DENIED`, `VERDICT_OVERRIDE`
- `target_id`: Target ID (`case_1`, `rev_req_...`, `user_...`)
- `prev_hash`: SHA-256 hash of previous log (Genesis: 64 zeros)
- `hash`: `SHA-256(prev_hash | created_at | actor_id | action_type | target_id)`
- `created_at`: ISO 8601 UTC timestamp

### Endpoint Mapping
- **Writers:** `init_db` (`SYSTEM_INIT`), `/register` (`USER_REGISTER`), `/login` (`LOGIN`), `/reveal-requests` (`REVEAL_REQUEST_SUBMITTED`), `/approve` (`REVEAL_APPROVED`), `/deny` (`REVEAL_DENIED`), `/override` (`VERDICT_OVERRIDE`).
- **Readers:** `GET /audit-logs`, `GET /audit-logs/verify`, `GET /reports/compliance`.

---

## 7. Authentication, Roles & Permissions

### Auth Flow
JWT tokens (HS256) signed with `SECRET_KEY`, expiring in 24 hours. Client passes header: `Authorization: Bearer <token>`.

### Seeded Roles & Permissions Matrix

| Role | Default Email | Password | Permissions | Permitted Actions |
|---|---|---|---|---|
| **Analyst** | `analyst@bank.com` | `password123` | `cases:read`<br>`cases:override`<br>`reveal:request` | View cases, request reveals, override verdicts. |
| **SeniorInvestigator** | `investigator@bank.com` | `password123` | `cases:read`<br>`cases:override`<br>`reveal:request`<br>`reveal:approve`<br>`audit:read`<br>`audit:export` | Full review, approve reveals (except self), view audit logs. |
| **Auditor** | `auditor@bank.com` | `password123` | `cases:read`<br>`audit:read`<br>`audit:export` | Read-only inspection of cases/audits; export reports. |
| **Admin** | `admin@bank.com` | `password123` | `users:manage`<br>`roles:manage`<br>`audit:read`<br>`audit:export` | User/role management. **Prohibited from approving reveals.** |
| **ServiceAccount** | `service@bank.com` | `password123` | `cases:read` | Automated agent data ingestion. |

---

## 8. CORS & Base URL Configuration

- **CORS:** Enabled in `app/main.py` with `allow_origins=["*"]`, `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`. (ML microservices do not configure CORS).
- **Default Base URLs:**
  - Backend API: `http://localhost:8000` (prefixed with `/api/v1`)
  - Tokenization Vault: `http://localhost:8002` (or `8001`)
  - Pattern Agent: `http://localhost:8003` (or `8001`)
  - Aggregator: `http://localhost:8004`

---

## 9. Seed & Demo Datasets

Seeded by `app/db/init_db.py`:
- **5 Roles & 8 Permissions**
- **5 Users:** `analyst@bank.com`, `investigator@bank.com`, `auditor@bank.com`, `admin@bank.com`, `service@bank.com` (passwords: `password123`).
- **7 Tokens with Encrypted Real Values:** `PERSON_001` (Aryan Maharaj, RBI Watchlist), `PERSON_002` (Oni Kannan), `PERSON_004` (Aishani Bassi), `ACCOUNT_NUMBER_001` (1819600133), `ACCOUNT_NUMBER_002` (2654235116), `ACCOUNT_NUMBER_003` (1849593103, OFAC Sanctions), `LOCATION_001` (Kishanganj).
- **3 Seeded Cases:**
  - `case_1`: txn_101, ₹230,968.00, Risk: **HIGH** (Score: 90). Findings: KYC, Graph, Pattern, Behavioral.
  - `case_2`: txn_102, ₹178,582.00, Risk: **MEDIUM** (Score: 30).
  - `case_3`: txn_103, ₹174,829.00, Risk: **LOW** (Score: 0).
- **External Data Files:** `raw_transactions.csv` (50 rows), `tokenized_employee_dataset.csv` (10k rows), `fake_data.py` (10 historical cases).

---

## 10. End-to-End Real Execution Responses

Live runtime verification on `http://127.0.0.1:8000`:

### 1. Analyst Login
`POST /api/v1/auth/login` with `{"email":"analyst@bank.com","password":"password123"}`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "user_analyst",
  "username": "analyst",
  "role": "Analyst",
  "permissions": ["cases:override", "cases:read", "reveal:request"]
}
```

### 2. Fetch Case 1 Detail
`GET /api/v1/cases/case_1` (Bearer `user_analyst`):
```json
{
  "id": "case_1",
  "transaction_id": "txn_101",
  "assigned_to": "user_analyst",
  "status": "OPEN",
  "transaction": {"id": "txn_101", "sender_token_id": "tok_subj_1", "receiver_token_id": "tok_acc_1", "amount": "230968.00"},
  "findings": [{"id": "af_1", "case_id": "case_1", "agent_type": "KYC_AGENT", "confidence_score": "0.95", "summary": "Matches RBI High-Risk Watchlist for PERSON_001."}],
  "verdict": {"id": "verd_1", "case_id": "case_1", "risk_level": "HIGH", "summary": "Composite Risk Score: 90/100 (HIGH)..."}
}
```

### 3. Submit Gated Reveal Request
`POST /api/v1/cases/case_1/reveal-requests` with `{"reason":"Customer matched RBI watchlist; escalation to FIU."}`:
```json
{
  "id": "rev_req_4472eeae",
  "case_id": "case_1",
  "requested_by": "user_analyst",
  "reason": "Customer matched RBI watchlist; escalation to FIU.",
  "status": "PENDING",
  "approved_by": null,
  "revealed_at": null
}
```

### 4. Senior Investigator Approves Reveal (PII Decrypted)
`POST /api/v1/reveal-requests/rev_req_4472eeae/approve` (Bearer `user_investigator`):
```json
{
  "request_id": "rev_req_4472eeae",
  "case_id": "case_1",
  "status": "APPROVED",
  "approved_by": "investigator (SeniorInvestigator)",
  "sender_real_value": "Aryan Maharaj",
  "receiver_real_value": "1819600133",
  "audit_log_id": "log_07d1677f",
  "hash": "c8ed9154a665eafc0bfac43aef357ac3578009cec0498665748f35e69b4f6d7c"
}
```

### 5. Override Case 2 Verdict
`POST /api/v1/cases/case_2/override` with `{"override_risk_level":"LOW","reason":"Confirmed travel notice; false positive jump."}`:
```json
{
  "id": "verd_2",
  "case_id": "case_2",
  "risk_level": "LOW",
  "summary": "[ANALYST OVERRIDE by analyst] Confirmed travel notice; false positive jump."
}
```

---

## 11. Gaps, Inconsistencies & Frontend Architecture Impediments

1. **Critical Audit Hash Chaining Bug (`audit_service.py:21`):**
   Entries are queried using `.order_by(AuditLog.id.desc()).first()`. Because IDs are non-sequential random UUID strings (`log_<hex>`), sorting by `id` does not return the chronologically previous log. As soon as multiple logs are created, `GET /api/v1/audit-logs/verify` fails with:
   `{"is_valid": false, "tampered_log_id": "...", "message": "prev_hash mismatch"}`.
   *Fix:* Order by `created_at.desc()` or an auto-incrementing integer sequence.
2. **Microservice Port Collision:**
   `app/core/config.py` sets `ML1_VAULT_URL` to `http://localhost:8001`, while `pattern-agent` also runs on port `8001` in CI (`integration.yml`). They collide if started together.
3. **Missing HTTP Server for Aggregator (ML4):**
   `app/core/config.py` defines `ML4_ORCHESTRATOR_URL: http://localhost:8004`, and `ml_client.py` attempts `GET /investigate/{case_id}`. However, `aggregator/` has no HTTP server—only Python library functions.
4. **Dead Code & Duplicate Legacy Schemas:**
   `app/api/v1/reveal.py` is unrouted and broken. `app/models/` and `app/schemas/` contain legacy V0 files (`case.py`, `user.py`, `override.py`, `audit_log.py`). The frontend must use **only** `schema_dtos.py` or the exported `openapi.json`.
5. **No Case Creation / Ingestion Endpoint:**
   `cases.py` only implements `GET /cases` and `GET /cases/{case_id}`. There is no `POST /cases` endpoint to create or ingest new cases from the UI.
6. **No Real-Time Multi-Agent Re-Analysis Endpoint:**
   Findings and verdicts are statically seeded in SQLite. There is no API endpoint for the UI to trigger a live multi-agent execution pipeline on demand.
7. **Missing Pagination & Search Filtering:**
   `GET /cases` and `GET /audit-logs` return unpaginated lists (`.all()`), which will cause performance degradation as data grows.
8. **Missing CORS on ML Microservices:**
   Only `app` has CORS enabled. Direct browser calls to `pattern-agent` or `Tokenization-Vault` will be blocked by the browser.
9. **Hardcoded Fallback Secret Key:**
   `app/core/config.py` has a default hardcoded `SECRET_KEY` without enforcing an environment variable check in production.
