# Tessera — Privacy-First Fraud Investigation Workspace

Tessera is an enterprise-grade, privacy-first fraud investigation web console designed for Tier-1 financial institutions. It enforces a strict **zero-knowledge operational model**: fraud detection AI agents inspect only pseudonymized synthetic tokens (e.g. `PERSON_001`, `ACC_001`, `LOC_001`), and real personally identifiable information (PII) is securely vaulted. 

Real identities can only be unmasked through a **gated dual-control authorization protocol** requiring review and approval by a designated second officer. Every reveal, override, and access event is written to an immutable, cryptographically chained SHA-256 audit ledger.

---

## Key Security Guarantees

1. **Zero Client-Side PII or Credential Persistence**:
   - Access tokens (JWT) and revealed unmasked identities are retained **exclusively in volatile JavaScript memory**.
   - Neither tokens nor decrypted PII are ever written to `localStorage`, `sessionStorage`, or cookies.
   - Logging out, closing the browser tab, or encountering an HTTP `401 Unauthorized` immediately purges all credentials and unmasked identities from memory.
2. **Dual-Control Separation of Duties**:
   - An investigator cannot approve their own reveal request (self-approval prevention enforced both client-side and server-side).
   - System Administrators (`Admin`) are categorically prohibited from approving reveals to eliminate unilateral superuser access.
3. **Microservice Network Isolation**:
   - The browser communicates **exclusively** with the core FastAPI gateway at `http://localhost:8000/api/v1`.
   - The frontend never connects directly to downstream ML microservices (ports 8001–8004).
4. **Honest Ledger Verification**:
   - Integrity verification of the SHA-256 audit hash chain is strictly manual (never executed automatically or silently mocked).
   - The verification status honestly reflects ledger health, identifying broken chain links or tampered block IDs.

---

## System Requirements

- **Node.js**: `v18.0.0` or higher (tested with `v24.x`)
- **npm**: `v9.0.0` or higher (tested with `v11.x`)
- **Python** (for running the real backend): Python 3.10+ with FastAPI, Uvicorn, SQLAlchemy, and dependencies from `requirements.txt`.

---

## Installation & Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   The repository includes `.env.example` and a pre-configured `.env.local`:
   ```bash
   # Copy example if setting up a custom environment
   cp .env.example .env.local
   ```

   **Environment Variable Reference:**
   | Variable | Default | Purpose |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI gateway |
   | `VITE_USE_MOCK` | `false` | When `true`, uses the client-side in-memory mock backend |
   | `VITE_SHOW_DEMO_LOGINS` | `false` | When `true`, displays 1-click quick-login buttons on the Sign In page |

---

## Running the Application

### Option A: Standalone Mock Mode (Zero Backend Setup Required)
To explore the complete workspace with seeded cases, multi-agent findings, and dual-control reveal workflows immediately:

1. Ensure `.env.local` contains:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_USE_MOCK=true
   VITE_SHOW_DEMO_LOGINS=true
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

### Option B: Live Mode with FastAPI Backend
1. In the repository root, start the FastAPI server:
   ```bash
   # From IBM-project/
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. In `frontend/.env.local`, set:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_USE_MOCK=false
   VITE_SHOW_DEMO_LOGINS=true
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

### Production Build & Linting
- **Build:**
  ```bash
  npm run build
  ```
- **Preview Production Build:**
  ```bash
  npm run preview
  ```
- **Lint:**
  ```bash
  npm run lint
  ```

---

## Seeded Users & RBAC Permissions Matrix

The database is initialized in `app/db/init_db.py` with the following 5 user accounts (default password for all: `password123`):

| Role | Username / Email | Permissions | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Analyst** | `analyst` / `analyst@bank.com` | `cases:read`, `cases:override`, `reveal:request` | Triages cases, overrides AI verdicts, submits identity reveal requests. |
| **Senior Investigator** | `investigator` / `investigator@bank.com` | `cases:read`, `cases:override`, `reveal:request`, `reveal:approve`, `audit:read`, `audit:export` | High-privilege officer authorized to approve dual-control reveal requests and inspect audit logs. |
| **Auditor** | `auditor` / `auditor@bank.com` | `cases:read`, `audit:read`, `audit:export` | Independent compliance inspector; reviews hash ledger and exports signed PDF/CSV reports. |
| **Admin** | `admin` / `admin@bank.com` | `users:manage`, `roles:manage`, `audit:read`, `audit:export` | System administrator; manages users and roles. **Barred from approving reveals**. |
| **Service Account** | `service_acc` / `service@bank.com` | `cases:read` | Machine integration account for automated ingestion. |

---

## Dual-Control Identity Reveal Walkthrough

Follow this scripted verification protocol across two browser profiles (or an Incognito window) to observe Tessera's privacy controls in action.

### Persona 1: Fraud Analyst (`analyst@bank.com`)
1. **Sign In**:
   - Open Browser Window A (`http://localhost:5173`).
   - Click the **Analyst** demo pill (or enter `analyst@bank.com` / `password123`).
2. **Review Case Queue**:
   - View the active case queue sorted by risk score.
   - Note the topbar pill: **"Identities hidden"** (teal lock).
   - Select case `case_001` (e.g. ₹2,30,968.00 flagged for circular transaction layering).
3. **Examine Tokenized Evidence**:
   - Notice that all actor and account identifiers are masked tokens: `PERSON_001`, `ACC_001`, `ACC_002`.
   - The multi-agent evidence breakdown shows findings from `KYC_AGENT`, `GRAPH_AGENT`, `PATTERN_AGENT`, and `BEHAVIORAL_AGENT`.
4. **Request Identity Reveal**:
   - Scroll to the **Protected Identity Vault** card. Status displays: *LOCKED (DUAL-CONTROL ENFORCED)*.
   - Click **Request identity reveal**.
   - Select reason category: `Regulatory or FIU escalation (PMLA / STR)`.
   - Enter justification: *"Suspected Hawala circular layering detected across 3 accounts. Escalating to FIU-IND."*
   - Click **Submit reveal request**.
   - Status updates immediately to **Pending senior approval**.

---

### Persona 2: Senior Investigator (`investigator@bank.com`)
1. **Sign In**:
   - Open Browser Window B (Incognito window or second browser profile).
   - Click the **Senior Investigator** demo pill (`investigator@bank.com` / `password123`).
2. **Navigate to Reveal Requests**:
   - Click **Reveal requests** in the left sidebar.
   - Filter by the **Pending** tab.
   - Locate the reveal request submitted by `analyst` for `case_001`.
   - Notice the **Approve** and **Deny** buttons. *(If you switch back to Window A as the Analyst, the Approve button is disabled with the tooltip "You cannot approve your own request".)*
3. **Approve Request**:
   - Click **Approve**.
   - A confirmation modal details the compliance warning: *"Approving this request unmasks synthetic tokens into verified legal names... This action is permanently recorded in the SHA-256 audit ledger."*
   - Confirm by clicking **Confirm & decrypt identity**.
4. **Inspect Decrypted PII & Ledger Block**:
   - A one-time decrypted reveal dialog opens:
     - **Sender Legal Name:** `Vikramaditya Sharma` (Account: `SBIN00045218901`)
     - **Receiver Legal Name:** `Aarav Financial Holdings Ltd` (Account: `HDFC00019283746`)
     - **Audit Log ID:** e.g. `log_7a8b9c0d`
     - **Block SHA-256 Hash:** e.g. `8f4b1a2c9d...` (with copy-to-clipboard button)
   - Notice the Topbar privacy status pill immediately switches to **amber**:
     `🔓 1 identity visible to you`.

---

### Persona 3: Compliance Auditor (`auditor@bank.com`)
1. **Sign In**:
   - Sign in as `auditor@bank.com` / `password123`.
2. **Inspect Audit Ledger**:
   - Click **Audit log** in the left sidebar.
   - Observe the newly recorded event:
     - **Action:** `Identity Reveal Approved`
     - **Actor:** `investigator` (`Senior Investigator`)
     - **Target:** `case_001`
     - **Previous Block Hash & Current Block Hash**: Monospace SHA-256 prefixes with one-click copy and full tooltip.
3. **Verify Ledger Integrity**:
   - Click the **Verify integrity** button (manual only; never automatic).
   - Review the ledger status report:
     - Total logs verified
     - Cryptographic chain state
     - Any tampered block IDs (if an inconsistency is detected).
4. **Export Compliance Report**:
   - Click **Export PDF** or **Export CSV** to download the signed `compliance_audit_report.pdf` or `.csv`.

---

## Architectural Notes & Known Backend Edge Cases

Refer to [frontend/BACKEND_NOTES.md](file:///c:/Users/Lenovo/Desktop/IBM/frontend/BACKEND_NOTES.md) for full details on backend schema nuances, including:
- **Audit Hash Chaining (`app/services/audit_service.py:21`)**: Non-sequential UUID sorting can cause hash mismatch when more than 2 entries exist in SQLite. The frontend UI reports verification status honestly without crashing.
- **Port Collision**: Backend `config.py` sets `ML1_VAULT_URL` to 8001, which collides with `pattern-agent` port 8001. The frontend isolates browser traffic strictly to port 8000.
- **Numeric Precision**: Transaction amounts and confidence scores are transmitted as formatted strings (`"230968.00"`) and formatted using Indian digit grouping (`₹2,30,968.00`).
