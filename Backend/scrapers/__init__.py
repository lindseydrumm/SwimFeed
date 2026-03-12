from config import settings


def print_ingest_info(target_url: str) -> None:
    """Print a startup banner showing where data will be sent and whether auth is active."""
    is_local = "localhost" in target_url or "127.0.0.1" in target_url
    destination = "local" if is_local else "remote"
    has_key = bool(settings.ingest_api_key)

    print(f"Ingestion target: {target_url} ({destination})")
    if has_key:
        print("API key: configured (will send X-API-Key header)")
    else:
        print("API key: not set (ingestion endpoints must be open)")
    print()
