import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import Base, get_db
from app.db.init_db import init_db
from app.core.security import create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    init_db(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def analyst_headers():
    token = create_access_token(
        subject="user_analyst",
        role="Analyst",
        expires_delta=None
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def investigator_headers():
    token = create_access_token(
        subject="user_investigator",
        role="SeniorInvestigator",
        expires_delta=None
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auditor_headers():
    token = create_access_token(
        subject="user_auditor",
        role="Auditor",
        expires_delta=None
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers():
    token = create_access_token(
        subject="user_admin",
        role="Admin",
        expires_delta=None
    )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def service_headers():
    token = create_access_token(
        subject="user_service",
        role="ServiceAccount",
        expires_delta=None
    )
    return {"Authorization": f"Bearer {token}"}
