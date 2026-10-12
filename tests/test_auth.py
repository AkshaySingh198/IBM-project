def test_register_new_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "username": "new_compliance_user",
            "email": "new_compliance@bank.com",
            "password": "securepassword123",
            "role_name": "Analyst"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "new_compliance_user"
    assert data["role_name"] == "Analyst"
    assert "cases:read" in data["permissions"]

def test_login_returns_jwt_with_permissions(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "investigator@bank.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "SeniorInvestigator"
    assert "reveal:approve" in data["permissions"]

def test_get_current_user_profile(client, investigator_headers):
    response = client.get("/api/v1/auth/me", headers=investigator_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "investigator@bank.com"
    assert data["role_name"] == "SeniorInvestigator"
