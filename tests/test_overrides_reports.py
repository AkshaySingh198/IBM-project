def test_analyst_verdict_override(client, analyst_headers):
    response = client.post(
        "/api/v1/cases/case_2/override",
        json={
            "override_risk_level": "LOW",
            "reason": "Customer confirmed travel plan; false positive geolocation jump."
        },
        headers=analyst_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"
    
    # Verify case status updated
    case_resp = client.get("/api/v1/cases/case_2", headers=analyst_headers)
    assert case_resp.json()["status"] == "OVERRIDDEN"
