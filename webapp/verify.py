from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:4173')

    # Wait for data to load
    page.wait_for_selector('text=Video & Cluster Visualization')
    time.sleep(2) # Give it some time to fetch JSONs

    page.screenshot(path='overview.png', full_page=True)

    # We don't necessarily have a class `.channel-selector`. Let's just find the select element inside the box.
    page.click('select')
    page.select_option('select', index=1)
    time.sleep(2)

    page.screenshot(path='channel_selected.png', full_page=True)

    page.click('text=Performance')
    time.sleep(2)

    page.screenshot(path='performance_tab.png', full_page=True)

    browser.close()
