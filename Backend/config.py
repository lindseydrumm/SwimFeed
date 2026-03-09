# config.py
#   Configuration management using Pydantic Settings
#   Loads from environment variables and .env files

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with type validation."""

    # Database Configuration
    database_url: str = "postgresql+psycopg2://dev:dev@localhost:5432/swimlive"

    # Scraper Configuration
    feed_url: str = "https://swimswam.com/feed/"
    api_url: str = "http://localhost:8000/ingest/article"
    event_api_url: str = "http://localhost:8000/ingest/event"

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
