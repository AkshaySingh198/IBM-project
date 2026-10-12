def test_analyst_cannot_approve_reveal(client, analyst_headers):
    # Analyst role does NOT possess reveal:approve permission
    response = client.post(
        "/api/v1/reveal-requests/rev_req_stub/approve",
        headers=analyst_headers
    )
    assert response.status_code == 403
    assert "Permission Denied" in response.json()["detail"]

def test_admin_is_prohibited_from_approving_reveal(client, admin_headers):
    # Admin role possesses roles:manage/users:manage but NOT reveal:approve
    response = client.post(
        "/api/v1/reveal-requests/rev_req_stub/approve",
        headers=admin_headers
    )
    assert response.status_code == 403

def test_auditor_has_read_only_access(client, auditor_headers):
    # Auditor can list cases and audit logs
    case_resp = client.get("/api/v1/cases", headers=auditor_headers)
    assert case_resp.status_code == 200
    
    audit_resp = client.get("/api/v1/audit-logs", headers=auditor_headers)
    assert audit_resp.status_code == 200

    # Auditor cannot submit a reveal request
    reveal_sub = client.post(
        "/api/v1/cases/case_1/reveal-requests",
        json={"reason": "Auditor attempting reveal request"},
        headers=auditor_headers
    )
    assert reveal_sub.status_code == 403
