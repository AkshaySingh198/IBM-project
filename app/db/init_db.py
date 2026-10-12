from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.schema_models import (
    Role, Permission, User, TokenEntity, VaultMapping,
    Transaction, FraudCase, AgentFinding, Verdict, WatchlistEntry
)
from app.core.security import get_password_hash
from app.core.vault_crypto import encrypt_pii
from app.services.audit_service import create_audit_entry

def init_db(db: Session):
    # Auto-detect if existing database schema is stale
    try:
        db.execute(text("SELECT username FROM users LIMIT 1"))
    except Exception:
        db.rollback()
        Base.metadata.drop_all(bind=engine)
        
    Base.metadata.create_all(bind=engine)
    
    # Check if database is already seeded
    if db.query(Role).first():
        return
    
    # 1. Seed Permissions
    permissions_data = [
        ("perm_cases_read", "cases:read"),
        ("perm_cases_override", "cases:override"),
        ("perm_reveal_request", "reveal:request"),
        ("perm_reveal_approve", "reveal:approve"),
        ("perm_audit_read", "audit:read"),
        ("perm_audit_export", "audit:export"),
        ("perm_users_manage", "users:manage"),
        ("perm_roles_manage", "roles:manage"),
    ]
    perm_objs = {}
    for pid, pname in permissions_data:
        p = Permission(id=pid, name=pname)
        db.add(p)
        perm_objs[pname] = p
    db.commit()
    
    # 2. Seed 5 Roles & RolePermission mappings
    roles_data = [
        ("role_analyst", "Analyst", "View tokenized cases, run agent checks, submit reveal requests", [
            "cases:read", "cases:override", "reveal:request"
        ]),
        ("role_senior_investigator", "SeniorInvestigator", "Approve/deny reveal requests, view audit logs, override verdicts", [
            "cases:read", "cases:override", "reveal:request", "reveal:approve", "audit:read", "audit:export"
        ]),
        ("role_auditor", "Auditor", "Read-only access across all cases, verdicts, reveal requests, and audit logs", [
            "cases:read", "audit:read", "audit:export"
        ]),
        ("role_admin", "Admin", "User and role management. Prohibited from approving identity reveals", [
            "users:manage", "roles:manage", "audit:read", "audit:export"
        ]),
        ("role_service_account", "ServiceAccount", "Automated service account for agent data ingestion", [
            "cases:read"
        ]),
    ]
    role_objs = {}
    for rid, rname, rdesc, perms in roles_data:
        r = Role(id=rid, name=rname, description=rdesc)
        for pname in perms:
            r.permissions.append(perm_objs[pname])
        db.add(r)
        role_objs[rname] = r
    db.commit()
    
    # 3. Seed 5 Users
    users_data = [
        ("user_analyst", "analyst", "analyst@bank.com", "role_analyst"),
        ("user_investigator", "investigator", "investigator@bank.com", "role_senior_investigator"),
        ("user_auditor", "auditor", "auditor@bank.com", "role_auditor"),
        ("user_admin", "admin", "admin@bank.com", "role_admin"),
        ("user_service", "service_acc", "service@bank.com", "role_service_account"),
    ]
    for uid, uname, uemail, rid in users_data:
        u = User(
            id=uid,
            username=uname,
            email=uemail,
            hashed_password=get_password_hash("password123"),
            role_id=rid
        )
        db.add(u)
    db.commit()
    
    # 4. Seed Tokens & Isolated AES-256 Vault Mappings (Aligned with Tokenization-Vault schema)
    tokens_data = [
        ("tok_subj_1", "PERSON_001", "PERSON", "Aryan Maharaj"),
        ("tok_subj_2", "PERSON_002", "PERSON", "Oni Kannan"),
        ("tok_subj_3", "PERSON_004", "PERSON", "Aishani Bassi"),
        ("tok_acc_1", "ACCOUNT_NUMBER_001", "ACCOUNT_NUMBER", "1819600133"),
        ("tok_acc_2", "ACCOUNT_NUMBER_002", "ACCOUNT_NUMBER", "2654235116"),
        ("tok_acc_3", "ACCOUNT_NUMBER_003", "ACCOUNT_NUMBER", "1849593103"),
        ("tok_loc_1", "LOCATION_001", "LOCATION", "Kishanganj"),
    ]
    for tid, tval, etype, real_val in tokens_data:
        tok = TokenEntity(id=tid, token_value=tval, entity_type=etype)
        db.add(tok)
        db.commit()
        
        # Isolated AES-256 Encrypted Vault Entry
        vault = VaultMapping(
            token_id=tid,
            encrypted_value=encrypt_pii(real_val)
        )
        db.add(vault)
    db.commit()
    
    # 5. Seed Watchlist Entries
    w1 = WatchlistEntry(id="wl_1", token_id="tok_subj_1", list_type="RBI_HIGH_RISK", source="RBI Circular 2025/Q4")
    w2 = WatchlistEntry(id="wl_2", token_id="tok_acc_3", list_type="OFAC_SANCTIONS", source="Global Sanctions DB")
    db.add_all([w1, w2])
    db.commit()
    
    # 6. Seed Transactions
    tx1 = Transaction(id="txn_101", sender_token_id="tok_subj_1", receiver_token_id="tok_acc_1", amount="230968.00")
    tx2 = Transaction(id="txn_102", sender_token_id="tok_subj_2", receiver_token_id="tok_acc_2", amount="178582.00")
    tx3 = Transaction(id="txn_103", sender_token_id="tok_subj_3", receiver_token_id="tok_acc_3", amount="174829.00")
    db.add_all([tx1, tx2, tx3])
    db.commit()
    
    # 7. Seed Cases
    c1 = FraudCase(id="case_1", transaction_id="txn_101", assigned_to="user_analyst", status="OPEN")
    c2 = FraudCase(id="case_2", transaction_id="txn_102", assigned_to="user_analyst", status="OPEN")
    c3 = FraudCase(id="case_3", transaction_id="txn_103", assigned_to="user_investigator", status="OPEN")
    db.add_all([c1, c2, c3])
    db.commit()
    
    # 8. Seed Agent Findings (Aligned with Pattern Agent, KYC, and Behavioral findings)
    af1 = AgentFinding(
        id="af_1",
        case_id="case_1",
        agent_type="KYC_AGENT",
        confidence_score="0.95",
        summary="Matches RBI High-Risk Watchlist entry for PERSON_001."
    )
    af2 = AgentFinding(
        id="af_1_graph",
        case_id="case_1",
        agent_type="GRAPH_AGENT",
        confidence_score="0.80",
        summary="Detected 3 linked token entities forming suspicious cluster."
    )
    af3 = AgentFinding(
        id="af_2",
        case_id="case_1",
        agent_type="PATTERN_AGENT",
        confidence_score="0.88",
        summary="High value transfer to new recipient from unusual device."
    )
    af4 = AgentFinding(
        id="af_3",
        case_id="case_1",
        agent_type="BEHAVIORAL_AGENT",
        confidence_score="0.85",
        summary="FLAGGED - unusual transaction pattern, 5 failed login attempts and after hours access."
    )
    db.add_all([af1, af2, af3, af4])
    db.commit()
    
    # 9. Seed Verdicts (Aligned with Aggregator scoring)
    v1 = Verdict(
        id="verd_1",
        case_id="case_1",
        risk_level="HIGH",
        summary="Composite Risk Score: 90/100 (HIGH). Multiple signals: Pattern Flag + KYC Match + Behavioral Anomaly + Graph Ring."
    )
    v2 = Verdict(
        id="verd_2",
        case_id="case_2",
        risk_level="MEDIUM",
        summary="Composite Risk Score: 30/100 (MEDIUM). Geolocation deviation flagged for review."
    )
    v3 = Verdict(
        id="verd_3",
        case_id="case_3",
        risk_level="LOW",
        summary="Composite Risk Score: 0/100 (LOW). Standard verified transaction pattern."
    )
    db.add_all([v1, v2, v3])
    db.commit()
    
    # 10. Seed Genesis Audit Log Entry
    create_audit_entry(
        db=db,
        actor_id="user_admin",
        action_type="SYSTEM_INIT",
        target_id="DATABASE_GENESIS"
    )
