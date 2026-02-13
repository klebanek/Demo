from playwright.sync_api import sync_playwright

def verify_reminders(page):
    print("Navigating to app...")
    page.goto("http://localhost:8080")

    # Wait for app to initialize
    page.wait_for_timeout(2000)

    # Initial state check
    btn = page.locator(".nav-btn-reminders")
    initial_label = btn.get_attribute("aria-label")
    print(f"Initial label: {initial_label}")

    if initial_label != "Przypomnienia":
        print("ERROR: Initial label should be 'Przypomnienia'")

    # Add a reminder via JS
    print("Adding a reminder...")
    page.evaluate("""
        Reminders.add({
            title: "Test Reminder",
            datetime: new Date(Date.now() + 3600000).toISOString(),
            type: "custom"
        })
    """)

    # Wait for badge to appear
    # The badge might take a moment because Reminders.add calls updateBadge async
    page.wait_for_selector("#reminders-badge", state="visible")

    # Check updated label
    # We might need to wait for the attribute to change
    page.wait_for_function('document.querySelector(".nav-btn-reminders").getAttribute("aria-label").includes("aktywnych")')

    updated_label = btn.get_attribute("aria-label")
    print(f"Updated label: {updated_label}")

    if "Przypomnienia, 1 aktywnych" not in updated_label:
        print(f"ERROR: Label should contain count. Got: {updated_label}")
    else:
        print("SUCCESS: Label updated correctly!")

    # Take screenshot
    page.screenshot(path="verification/reminders_badge.png")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    verify_reminders(page)
    browser.close()
