def test_reveal_request_validation(client, analyst_headers):
    # Fails if reason is empty
    response = client.post(
        "/api/v1/cases/case_1/reveal-requests",
        json={"reason": "   "},
        headers=analyst_headers
    )
    assert response.status_code == 400
    assert "The 'reason' field in the request body cannot be empty" in response.json()["detail"]

def test_reveal_request_with_account_number_or_token(client, analyst_headers):
    # Lookup by account number "1819600133" directly resolves to case_1
    response = client.post(
        "/api/v1/cases/1819600133/reveal-requests",
        json={"reason": "FIU"},
        headers=analyst_headers
    )
    assert response.status_code == 201
    assert response.json()["case_id"] == "case_1"
