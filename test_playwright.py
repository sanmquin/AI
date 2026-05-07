from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:4174')

    # Wait for channels to load
    page.wait_for_selector('.select select', timeout=10000)

    # Select first channel
    page.select_option('.select select', index=1)
    page.wait_for_timeout(1000)

    # Click "Performance" tab
    page.click('text="Performance"')
    page.wait_for_timeout(1000)

    page.screenshot(path='performance_tab.png', full_page=True)
    browser.close()
