# config.py
#   Configuration management using Pydantic Settings
#   Loads from environment variables and .env files

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with type validation."""

    # Database Configuration
    database_url: str = "postgresql+psycopg2://dev:dev@localhost:5432/swimlive"

    # Scraper Configuration
    article_api_url: str = "http://localhost:8000/ingest/article"
    event_api_url: str = "http://localhost:8000/ingest/event"
    athlete_api_url: str = "http://localhost:8000/ingest/athlete"

    # Security
    ingest_api_key: str = (
        ""  # If set, /ingest/* endpoints require this as X-API-Key header
    )
    cors_origins: str = "http://localhost:5173"  # Comma-separated allowed origins

    # Application Configuration
    app_name: str = "Swim Live Backend"
    debug: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
