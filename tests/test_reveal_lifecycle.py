def test_full_gated_reveal_lifecycle_and_vault_decryption(
    client, analyst_headers, investigator_headers
):
    # 1. Analyst submits reveal request for case_1
    submit_resp = client.post(
        "/api/v1/cases/case_1/reveal-requests",
        json={"reason": "Formal FIU law enforcement escalation request regarding structuring"},
        headers=analyst_headers
    )
    assert submit_resp.status_code == 201
    req_data = submit_resp.json()
    assert req_data["status"] == "PENDING"
    req_id = req_data["id"]

    # 2. Analyst attempts to self-approve -> Must fail
    self_app_resp = client.post(
        f"/api/v1/reveal-requests/{req_id}/approve",
        headers=analyst_headers
    )
    assert self_app_resp.status_code == 403 # Permission denied

    # 3. Senior Investigator approves reveal request
    app_resp = client.post(
        f"/api/v1/reveal-requests/{req_id}/approve",
        headers=investigator_headers
    )
    assert app_resp.status_code == 200
    app_data = app_resp.json()
    assert app_data["status"] == "APPROVED"
    assert app_data["sender_real_value"] == "Aryan Maharaj"
    assert app_data["receiver_real_value"] == "1819600133"
    assert "hash" in app_data

def test_prevent_self_approval_for_senior_investigator(client, investigator_headers):
    # Senior Investigator submits their own reveal request
    submit_resp = client.post(
        "/api/v1/cases/case_2/reveal-requests",
        json={"reason": "Self-submitted reveal request for testing dual-control rule"},
        headers=investigator_headers
    )
    assert submit_resp.status_code == 201
    req_id = submit_resp.json()["id"]

    # Senior Investigator attempts to approve their OWN reveal request -> Must fail (400 Bad Request)
    self_app_resp = client.post(
        f"/api/v1/reveal-requests/{req_id}/approve",
        headers=investigator_headers
    )
    assert self_app_resp.status_code == 400
    assert "Investigators cannot approve their own identity reveal requests" in self_app_resp.json()["detail"]
