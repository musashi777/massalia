from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")
    page.wait_for_timeout(1000)

    # Focus the search button via keyboard
    page.keyboard.press("Tab")
    page.wait_for_timeout(500)
    page.keyboard.press("Tab")
    page.wait_for_timeout(500)
    page.keyboard.press("Tab")
    page.wait_for_timeout(500)
    page.keyboard.press("Enter")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/modal-focus.png")
    page.wait_for_timeout(1000)

    # Close modal
    page.keyboard.press("Escape")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
