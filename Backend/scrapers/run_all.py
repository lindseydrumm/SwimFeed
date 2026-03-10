# run_all.py
# Runs every scraper in sequence.
# Usage: docker exec swimlive_backend uv run -m scrapers.run_all

from scrapers.rss_scrape import main as rss_main
from scrapers.wa_events_scrape import main as wa_events_main
from scrapers.usaswim_events_scrape import main as usaswim_events_main
from scrapers.wa_athletes_scrape import main as athletes_main


def main():
    print("=== Running RSS scraper ===")
    rss_main()

    print("\n=== Running WA Events scraper ===")
    wa_events_main()

    print("\n=== Running USA Swimming Events scraper ===")
    usaswim_events_main()

    print("\n=== Running Athletes scraper ===")
    athletes_main()

    print("\n=== All scrapers finished ===")


if __name__ == "__main__":
    main()
