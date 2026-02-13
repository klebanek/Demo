## 2026-02-13 - [Stored XSS via JSON Import]
**Vulnerability:** The application allowed importing JSON data where `id` properties were trusted and used directly in `onclick` handlers, leading to Stored XSS.
**Learning:** Even internal IDs, if sourced from user input (import file), must be sanitized or validated before use, especially when injected into execution contexts like event handlers.
**Prevention:** Sanitize all imported data, specifically validating identifiers against a strict allowlist (e.g., alphanumeric) or regenerating them.
