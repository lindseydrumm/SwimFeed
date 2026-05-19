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


def normalize_name(full_name: str | None) -> str | None:
    """Convert 'Leon MARCHAND' -> 'Leon Marchand'.

    World Aquatics returns last names in ALL CAPS. This title-cases any
    token whose alphabetic characters are entirely uppercase. Mixed-case
    or already-titled tokens are left untouched.

    Python's str.title() handles apostrophes and hyphens reasonably:
      "O'CONNOR".title()    -> "O'Connor"
      "JEAN-PIERRE".title() -> "Jean-Pierre"

    Imperfect cases like "Mc/Mac" prefixes ("MCDONALD" -> "Mcdonald")
    are accepted; this is a best-effort transform.
    """
    if not full_name:
        return full_name
    parts = full_name.split()
    out = []
    for p in parts:
        letters_only = "".join(c for c in p if c.isalpha())
        if letters_only and letters_only.isupper():
            out.append(p.title())
        else:
            out.append(p)
    return " ".join(out)
