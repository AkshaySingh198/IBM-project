def test_list_cases(client, analyst_headers):
    response = client.get("/api/v1/cases", headers=analyst_headers)
    assert response.status_code == 200
    cases = response.json()
    assert len(cases) >= 3
    assert cases[0]["transaction"]["sender_token_id"] is not None

def test_get_case_detail_with_transaction_findings_verdict(client, analyst_headers):
    response = client.get("/api/v1/cases/case_1", headers=analyst_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "case_1"
    assert data["transaction"]["sender_token_id"] == "tok_subj_1"
    assert len(data["findings"]) >= 3
    assert data["verdict"]["risk_level"] == "HIGH"
