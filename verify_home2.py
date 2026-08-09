import argparse
import os
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright


def run_cuj(page: Page, base_url: str, output_dir: Path) -> None:
    page.goto(base_url, wait_until="domcontentloaded")

    skip_link = page.locator("#skip-link")
    brand_link = page.locator(".site-title a")
    search_button = page.locator("#search-open-btn")
    search_modal = page.locator("#search-modal")
    search_input = page.locator("#search-input")

    expect(search_button).to_be_visible()

    # Verify the real keyboard path to the search button.
    page.keyboard.press("Tab")
    expect(skip_link).to_be_focused()

    page.keyboard.press("Tab")
    expect(brand_link).to_be_focused()

    page.keyboard.press("Tab")
    expect(search_button).to_be_focused()

    # Open the modal and wait for observable state changes.
    page.keyboard.press("Enter")
    expect(search_modal).to_have_attribute("aria-hidden", "false")
    expect(search_modal).to_be_visible()
    expect(search_input).to_be_focused()

    screenshots_dir = output_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(screenshots_dir / "modal-focus.png"))

    # Close the modal and verify that focus returns to its trigger.
    page.keyboard.press("Escape")
    expect(search_modal).to_have_attribute("aria-hidden", "true")
    expect(search_modal).to_be_hidden()
    expect(search_button).to_be_focused()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Verify keyboard navigation on the Massalia home page."
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("VERIFY_BASE_URL", "http://localhost:3000"),
        help="Site URL. Defaults to $VERIFY_BASE_URL or http://localhost:3000.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(os.getenv("VERIFY_OUTPUT_DIR", "verification")),
        help="Directory for screenshots and videos.",
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Show the browser. Headless mode is used by default.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = args.output_dir.expanduser().resolve()
    videos_dir = output_dir / "videos"
    videos_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=not args.headed)
        context = browser.new_context(record_video_dir=str(videos_dir))
        try:
            run_cuj(
                context.new_page(),
                base_url=args.base_url,
                output_dir=output_dir,
            )
        finally:
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
