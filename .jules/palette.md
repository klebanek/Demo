## 2025-01-17 - Dynamic ARIA labels for badged buttons
**Learning:** Icon-only buttons with visual badges (e.g., notifications) need dynamic `aria-label` updates. Static labels like "Notifications" hide the unread count from screen readers.
**Action:** When updating a visual badge, always update the parent button's `aria-label` to include the count (e.g., "Notifications, 5 unread").
