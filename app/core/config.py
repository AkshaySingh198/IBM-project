from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Privacy-Preserving AI Fraud Governance API"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # ML Microservice Integration / Stubs
    USE_ML_STUBS: bool = True
    ML1_VAULT_URL: str = "http://localhost:8001"
    ML4_ORCHESTRATOR_URL: str = "http://localhost:8004"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
