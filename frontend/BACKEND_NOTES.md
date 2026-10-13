# Tessera Backend Audit & Schema Comparison Notes

This document records all schema discrepancies, architectural gaps, and backend bugs discovered during inspection of the backend codebase (`app/`), database initializer (`app/db/init_db.py`), and OpenAPI specification (`openapi.json`). All frontend components in `frontend/` are designed to work around these issues without modifying backend code.

---

## 1. Critical Backend Bugs

### Bug 1: Audit Log Hash Chaining Broken by Non-Sequential UUID Ordering
- **File & Line:** `app/services/audit_service.py`, line 21
  ```python
  last_log = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
  ```
- **Description:** Audit log IDs are generated as `f"log_{uuid.uuid4().hex[:8]}"` (random hex strings). Ordering by `AuditLog.id.desc()` sorts alphabetically by random hex rather than chronologically.
- **Consequence:** When more than two audit events are written, `last_log` does not point to the chronologically preceding entry. Consequently, calling `GET /api/v1/audit-logs/verify` fails with:
  `{"is_valid": false, "tampered_log_id": "...", "message": "Hash chain broken at log ID ...: prev_hash mismatch."}`
- **Frontend Workaround:** The frontend `/audit` page displays verification results honestly without assuming validity, provides a manual "Verify integrity" button (never run automatically on mount), and clearly explains tampered log IDs or prev_hash breaks in the UI.

### Bug 2: Microservice Port Collision Between Vault and Pattern Agent
- **File & Line:** `app/core/config.py` line 17 vs `.github/workflows/integration.yml` line 46
  - `app/core/config.py`: `ML1_VAULT_URL: str = "http://localhost:8001"`
  - `.github/workflows/integration.yml`: `uvicorn main:app --host 127.0.0.1 --port 8001` (Pattern Agent)
- **Consequence:** Both services target port 8001, resulting in port conflict when launched simultaneously on the host.
- **Frontend Workaround:** The browser client communicates exclusively with the backend on port 8000 (`/api/v1`) via `client.ts`. The browser never connects directly to ports 8001–8004.

---

## 2. API & OpenAPI Schema Nuances

### Schema Discrepancy 1: String-Encoded Financial and Confidence Values
- **Files:** `app/schemas/schema_dtos.py` lines 67, 76 vs `openapi.json`
- **Details:**
  - `TransactionDTO.amount` is defined as a `string` (e.g. `"230968.00"`), not a `float` or `number`.
  - `AgentFindingDTO.confidence_score` is defined as a `string` (e.g. `"0.95"`), not a numeric float.
- **Frontend Adaptation:** `frontend/src/api/types.ts` defines `amount: string` and `confidence_score: string`. The UI uses `derive.ts` and numeric formatters with Indian digit grouping (`en-IN`) to format `₹2,30,968.00` while preserving string precision.

### Schema Discrepancy 2: Duplicate / Orphaned Legacy Backend Models
- **Files:**
  - Active: `app/models/schema_models.py` and `app/schemas/schema_dtos.py` (13 normalized tables)
  - Orphaned: `app/api/v1/reveal.py`, `app/models/case.py`, `app/models/user.py`, `app/models/override.py`, `app/models/audit_log.py`, `app/schemas/case.py`
- **Details:** `app/api/v1/reveal.py` references legacy integer-ID models (`case_id: int`) and is not registered in `app/main.py`. The active reveal workflow is in `app/api/v1/reveal_requests.py` (`POST /cases/{case_id}/reveal-requests`, `POST /reveal-requests/{id}/approve`, `POST /reveal-requests/{id}/deny`).
- **Frontend Adaptation:** The frontend binds exclusively to active routes registered in `app/main.py` and documented in `openapi.json`.

### Schema Discrepancy 3: Aggregator (ML4) Orchestrator Missing HTTP Server
- **File & Line:** `app/core/config.py` line 18, `app/services/ml_client.py` lines 9, 42
- **Details:** `app` expects an external orchestrator at `http://localhost:8004/investigate/{case_id}`. However, `aggregator/` in the repository is a pure Python library without an HTTP service or FastAPI wrapper.
- **Frontend Adaptation:** `app` handles this gracefully via fallback stubs (`USE_ML_STUBS=True`). The frontend interacts solely with `/cases` and `/reveal-requests`.

### Schema Discrepancy 4: Report Export Content-Disposition Header
- **File & Line:** `app/api/v1/reports.py` lines 27–34
- **Details:** `GET /reports/compliance` returns a raw `Response(content=..., media_type="application/pdf")` or `"text/csv"` without a `Content-Disposition: attachment; filename=...` HTTP response header.
- **Frontend Adaptation:** The frontend `downloadReport` method reads the response body as a binary `Blob`, constructs a local object URL, creates a synthetic `<a download="compliance_audit_report.{pdf|csv}">` anchor element, triggers a simulated click, and cleans up the URL object.

---

## 3. Missing Frontend Capabilities in API

1. **No Case Ingestion (`POST /cases`):**
   The API exposes `GET /cases` and `GET /cases/{case_id}`, but no endpoint to upload transactions or ingest new cases from the UI.
2. **No On-Demand Multi-Agent Execution Endpoint:**
   Findings and verdicts are statically pre-calculated in SQLite. There is no `POST /cases/{case_id}/analyze` endpoint to trigger live multi-agent execution from the UI.
3. **Missing Pagination & Server-Side Filtering:**
   `GET /cases` and `GET /audit-logs` return unpaginated lists (`.all()`). The frontend handles this by rendering an in-memory client-side paginated/filtered `DataTable`.
4. **Missing CORS on Subordinate ML Microservices:**
   Only `app/main.py` configures `CORSMiddleware`. Subordinate ML microservices on ports 8001–8003 do not configure CORS, reinforcing that all browser traffic must go through `app`.
5. **Hardcoded Fallback Secret Key:**
   `app/core/config.py` uses a hardcoded fallback secret key (`"secret_for_demo_purposes_only"`). In production, this must be enforced via an environment variable check.
