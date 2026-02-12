# config.py
#   Configuration management using Pydantic Settings
#   Loads from environment variables and .env files

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with type validation."""

    # Database Configuration
    database_url: str = "postgresql+psycopg2://dev:dev@db:5432/swimlive"

    # Scraper Configuration
    feed_url: str = "https://swimswam.com/feed/"
    api_url: str = "http://backend:8000/ingest/article"

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
