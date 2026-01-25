---
name: webapp-testing
description: 驗證前端功能、debug UI 行為、E2E 測試時使用。使用 Playwright 測試本地 web 應用。
---

# Web Application Testing

To test local web applications, write native Python Playwright scripts.

## Decision Tree: Choosing Your Approach

```
User task → Is it static HTML?
    ├─ Yes → Read HTML file directly to identify selectors
    │         ├─ Success → Write Playwright script using selectors
    │         └─ Fails/Incomplete → Treat as dynamic (below)
    │
    └─ No (dynamic webapp) → Is the server already running?
        ├─ No → Start server first, then write Playwright script
        │
        └─ Yes → Reconnaissance-then-action:
            1. Navigate and wait for networkidle
            2. Take screenshot or inspect DOM
            3. Identify selectors from rendered state
            4. Execute actions with discovered selectors
```

## Basic Playwright Script

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)  # Always launch chromium in headless mode
    page = browser.new_page()
    page.goto('http://localhost:5173')  # Server already running and ready
    page.wait_for_load_state('networkidle')  # CRITICAL: Wait for JS to execute
    # ... your automation logic
    browser.close()
```

## Reconnaissance-Then-Action Pattern

1. **Inspect rendered DOM**:
   ```python
   page.screenshot(path='/tmp/inspect.png', full_page=True)
   content = page.content()
   page.locator('button').all()
   ```

2. **Identify selectors** from inspection results

3. **Execute actions** using discovered selectors

## Common Pitfall

❌ **Don't** inspect the DOM before waiting for `networkidle` on dynamic apps
✅ **Do** wait for `page.wait_for_load_state('networkidle')` before inspection

## Best Practices

- Use `sync_playwright()` for synchronous scripts
- Always close the browser when done
- Use descriptive selectors: `text=`, `role=`, CSS selectors, or IDs
- Add appropriate waits: `page.wait_for_selector()` or `page.wait_for_timeout()`

## Example: Testing a Form

```python
from playwright.sync_api import sync_playwright

def test_login_form():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to login page
        page.goto('http://localhost:3000/login')
        page.wait_for_load_state('networkidle')

        # Fill in the form
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('input[name="password"]', 'password123')

        # Submit
        page.click('button[type="submit"]')

        # Wait for navigation
        page.wait_for_url('**/dashboard')

        # Verify success
        assert page.locator('h1').text_content() == 'Dashboard'

        browser.close()

if __name__ == '__main__':
    test_login_form()
    print('Test passed!')
```

## Example: Taking Screenshots for Debugging

```python
from playwright.sync_api import sync_playwright

def debug_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Take full page screenshot
        page.screenshot(path='/tmp/debug-screenshot.png', full_page=True)

        # Get page content for analysis
        html = page.content()
        print(f'Page title: {page.title()}')
        print(f'Found {len(page.locator("button").all())} buttons')

        browser.close()

if __name__ == '__main__':
    debug_page()
```

## Example: Capturing Console Logs

```python
from playwright.sync_api import sync_playwright

def capture_console():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console messages
        logs = []
        page.on('console', lambda msg: logs.append(f'{msg.type}: {msg.text}'))

        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')

        # Print captured logs
        for log in logs:
            print(log)

        browser.close()

if __name__ == '__main__':
    capture_console()
```

## Card ERP Testing Notes

For this project:
- **buyer-web**: Nuxt 3, default port 3001
- **admin-web**: Vue 3 SPA, default port 3002
- **pos-web**: Vue 3 PWA, default port 3003
- **api**: Fastify, default port 3000

Always verify the correct port before testing.
