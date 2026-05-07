from playwright.sync_api import sync_playwright
import time
import subprocess

# Start server
process = subprocess.Popen(['npm', 'run', 'dev'], cwd='webapp', stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(3) # Wait for server to start

try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto('http://localhost:5173')

        # Wait for channels to load
        page.wait_for_selector('text=Video & Cluster Visualization')
        time.sleep(2) # ensure data loads

        # Find the dropdown and select the first available channel
        dropdown = page.locator('select').first
        dropdown.select_option(index=1)
        time.sleep(1)

        # Click the 'Competition' tab
        page.locator('text=Competition').click()
        time.sleep(2)

        # Click on one of the scatter dots (that is a channel) by finding path elements with fill colors
        paths = page.locator('path[fill="#d62728"], path[fill="#2ca02c"]')
        if paths.count() > 0:
            paths.first.click(force=True)
            time.sleep(1)
            page.screenshot(path='competition_tab_expanded_v2.png', full_page=True)
        else:
            print("No scatter dots found.")

        browser.close()
finally:
    process.terminate()
