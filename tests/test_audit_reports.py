def test_hash_chain_verification_and_export(client, auditor_headers):
    # Fetch audit logs
    logs_resp = client.get("/api/v1/audit-logs", headers=auditor_headers)
    assert logs_resp.status_code == 200
    logs = logs_resp.json()
    assert len(logs) >= 1

    # Verify SHA-256 Hash Chain Integrity
    verify_resp = client.get("/api/v1/audit-logs/verify", headers=auditor_headers)
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["is_valid"] is True
    assert verify_data["tampered_log_id"] is None

    # CSV Export
    csv_resp = client.get("/api/v1/reports/compliance?format=csv", headers=auditor_headers)
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Previous Hash" in csv_resp.text

    # PDF Export
    pdf_resp = client.get("/api/v1/reports/compliance?format=pdf", headers=auditor_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 100
