"""
Central application configuration.
All secrets/config come from environment variables (see .env.example at repo root).
Never hardcode credentials here.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "AutoML Agent Platform"
    ENV: str = "development"
    DEBUG: bool = True

    # Database
    # Defaults to local SQLite for easy dev/demo bring-up.
    # In docker-compose / production this is overridden to a Postgres DSN.
    DATABASE_URL: str = "sqlite:///./dev.db"

    # Auth
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_ENV"  # noqa: S105 - dev default, must be overridden
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage (off-chain dataset storage)
    DATASET_STORAGE_DIR: str = "./storage/datasets"
    MAX_UPLOAD_SIZE_MB: int = 200
    ALLOWED_UPLOAD_EXTENSIONS: tuple = (".csv", ".xlsx", ".xls")

    # Blockchain (Phase 8/9 - not wired up yet, values are placeholders)
    CHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    DATASET_REGISTRY_CONTRACT_ADDRESS: str = ""
    CHAIN_DEPLOYER_PRIVATE_KEY: str = ""  # noqa: S105 - never commit a real key here


settings = Settings()
