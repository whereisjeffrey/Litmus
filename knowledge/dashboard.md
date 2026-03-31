# Dashboard / Web App Best Practices

## Overview
The dashboard is where users spend most of their time in a web application. It surfaces key information, enables primary workflows, and sets the tone for the entire product experience. Success means users can quickly find what they need, take action on important items, and feel productive — not overwhelmed. First-time users need guidance; power users need speed. The dashboard must serve both.

## Rules

### Empty States: First-Time User Sees Helpful Empty State
- **What to check:** When a new user first sees the dashboard (no data yet), they see a designed empty state with guidance — not a blank page, error, or "No data found" message.
- **Why it matters:** 40-60% of users who sign up never return after day one (Mixpanel data). A blank dashboard is the leading cause of first-session abandonment in SaaS apps.
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Design custom empty states for every major section. Include: an illustration or icon, a brief explanation of what will appear here, and a clear CTA to create the first item. Example: "No projects yet. Create your first project to get started."

### Empty States: Clear First Action to Take
- **What to check:** The empty state or new-user dashboard prominently shows the single most important first action the user should take.
- **Why it matters:** New users need direction. Apps that guide users to their first meaningful action within 5 minutes have 3x better retention at day 30 (Mixpanel, Product Benchmarks).
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Identify the "aha moment" for your product. Design the empty state to drive that specific action. Use a prominent button: "Create your first project", "Import your data", "Invite your team."

### Empty States: Sample Data or Getting Started Guide
- **What to check:** New users are offered sample/demo data to explore, or a getting-started guide that walks them through key features.
- **Why it matters:** Sample data lets users experience the product's value before investing time in setup. 68% of SaaS users prefer to explore with sample data rather than read documentation (Pendo).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Pre-populate the dashboard with realistic sample data that demonstrates value. Add a "Getting Started" guide as a dismissible card or checklist. Make it easy to clear sample data when ready.

### Empty States: Progress Indicator for Setup Completion
- **What to check:** A setup progress indicator (checklist, progress bar, or step counter) shows new users what they've completed and what remains.
- **Why it matters:** Progress indicators leverage the Zeigarnik effect (people remember incomplete tasks). Setup checklists increase activation rates by 20-30% (Intercom data).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show a checklist or progress bar: "3 of 5 steps completed." Include items like: create first project, invite a team member, connect an integration. Make it dismissible after completion.

### Navigation: Sidebar or Top Nav for Primary Navigation
- **What to check:** The dashboard has a consistent primary navigation pattern — either a left sidebar or top navigation bar — that is present on all pages.
- **Why it matters:** Consistent navigation is the foundation of usable web apps. Inconsistent or missing navigation forces users to use the back button and increases cognitive load (NNGroup).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use a left sidebar for apps with many sections (10+ pages). Use top nav for simpler apps (5-7 sections). Sidebar should be collapsible. Include icons with labels, not icons alone.

### Navigation: Breadcrumbs for Deep Pages
- **What to check:** Pages more than 2 levels deep in the navigation hierarchy show breadcrumbs indicating the current location (e.g., Projects > My Project > Settings).
- **Why it matters:** Breadcrumbs reduce back-button usage by 35% (NNGroup). They orient users within complex navigation structures and provide quick escape paths.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add breadcrumbs below the top bar or above the page title. Make each breadcrumb level clickable. Show the full path from the section root to the current page.

### Navigation: Quick Search or Command Palette
- **What to check:** A search function (accessible via Ctrl/Cmd+K or a search icon) lets users find pages, actions, and data without navigating through menus.
- **Why it matters:** Command palettes reduce time-to-action by 40% for power users (Linear/Raycast UX studies). They're the fastest navigation method for users who know what they want.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Implement a search/command palette accessible via Ctrl/Cmd+K. Index pages, actions, settings, and data. Show recent searches and popular actions. Make it keyboard-navigable.

### Navigation: Recent Items Accessible
- **What to check:** A "Recent" or "Recently viewed" section provides quick access to the last 5-10 items the user worked with.
- **Why it matters:** Users frequently return to the same items. Recency-based navigation reduces navigation time by 25% for common workflows.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add a "Recent" section in the sidebar or as a dropdown. Show the last 5-10 items with icon, name, and type. Update in real-time as users navigate.

### Navigation: Keyboard Shortcuts for Common Actions
- **What to check:** Common actions (new item, search, navigate sections) have keyboard shortcuts. A shortcut reference is available (e.g., ? key opens help).
- **Why it matters:** Power users are 2-3x more productive with keyboard shortcuts (NNGroup). Keyboard-driven apps have higher user satisfaction and lower churn.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add shortcuts for: new item (N), search (Ctrl/Cmd+K), navigation (G then letter), help (?). Show shortcuts in tooltips. Provide a shortcut reference sheet.

### Data Display: Most Important Metric Prominent
- **What to check:** The dashboard highlights the 1-3 most important metrics or KPIs in a visually prominent position (large numbers, top of page).
- **Why it matters:** Users open the dashboard to check status. If the key metric isn't immediately visible, the dashboard fails its primary purpose. Focus on what matters most, not on showing everything.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Place the 1-3 most important metrics at the top of the dashboard in large, readable cards. Include trend indicators (up/down arrows, percentage change). Show context: "25% higher than last week."

### Data Display: Actionable Data Not Just Display
- **What to check:** Dashboard elements link to relevant detail pages or actions. Metrics, charts, and lists are clickable, not just informational.
- **Why it matters:** A dashboard that only shows data without paths to action creates a dead end. Actionable dashboards increase feature adoption by 20% (Pendo).
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Make every metric, chart, and list item clickable. Clicking a metric opens the detailed view. Clicking a list item opens the item. Add quick-action buttons where relevant.

### Data Display: Loading States for Async Data
- **What to check:** When data is loading, skeleton screens, shimmer effects, or loading spinners indicate that content is on its way.
- **Why it matters:** Content that pops in without warning causes layout shifts and confusion. Loading states manage expectations and make the app feel responsive even during slow loads.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use skeleton screens (gray placeholder shapes) that match the content layout. Show spinners for discrete actions (saving, submitting). Never show a blank area that silently fills in.

### Data Display: Error States with Recovery Options
- **What to check:** When data fails to load, a clear error message appears with a retry option — not a blank area, raw error code, or infinite spinner.
- **Why it matters:** Unhandled errors are the worst user experience. A clear error with a retry button recovers 80% of transient failures without user frustration.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Show a friendly error message: "Unable to load data. Try again." Include a retry button. Log the error for debugging. Don't show stack traces or technical error codes to users.

### Data Display: Real-Time or Clear Refresh Indicators
- **What to check:** If data is real-time, users understand it's live. If data is cached or periodic, a "Last updated: X minutes ago" indicator and manual refresh option are available.
- **Why it matters:** Users need to know if they're seeing current data. Stale data without a timestamp leads to incorrect decisions.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Show "Last updated: 2 minutes ago" near data sections. Provide a manual refresh button. For real-time data, show a green dot or "Live" indicator.

### Onboarding: Progressive Disclosure
- **What to check:** The dashboard doesn't show all features and options at once. Advanced features are progressively revealed as users become more experienced.
- **Why it matters:** Information overload is the #1 complaint about complex dashboards (Pendo, State of Product 2023). Progressive disclosure reduces cognitive load and improves task completion by 20%.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Start with essential features visible. Reveal advanced options behind "More" menus or when users reach certain milestones. Use feature flags to control complexity.

### Onboarding: Tooltips for New Features
- **What to check:** New or non-obvious features have contextual tooltips or coachmarks that appear on first encounter.
- **Why it matters:** Tooltips increase feature discovery by 40% (Appcues data). Without them, users may never find features that could make them more productive.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Add tooltips that appear once per feature per user. Keep them brief (1-2 sentences). Include a "Got it" dismiss button. Don't overwhelm users with multiple tooltips at once.

### Onboarding: Setup Checklist Visible
- **What to check:** New users see a setup checklist tracking their progress through initial configuration steps.
- **Why it matters:** Checklists leverage the completion bias — people are motivated to complete a partially finished list. Apps with setup checklists see 30% higher activation (Intercom).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show a checklist card on the dashboard: "Complete your setup (2/5)." Items might include: "Add a profile photo", "Create your first project", "Invite a team member." Mark completed items with checkmarks.

### Onboarding: Skip Option for Experienced Users
- **What to check:** Setup checklists, tours, and onboarding guides can be dismissed or skipped by users who don't need them.
- **Why it matters:** Forced onboarding frustrates experienced users and users migrating from similar products. It feels patronizing and wastes time.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a "Skip" or "Dismiss" option on all onboarding elements. Don't show them again after dismissal. Optionally, provide a "Restart tour" option in settings for users who change their mind.

### Performance: Dashboard Loads Core Data Within 2 Seconds
- **What to check:** The most important dashboard data (key metrics, primary list) loads and renders within 2 seconds. Secondary data can lazy load.
- **Why it matters:** The dashboard is the most frequently visited page. Slow dashboards compound into hours of wasted time. Users perceive apps as "fast" or "slow" based on dashboard speed.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Prioritize loading the most important data first. Use server-side rendering for initial state. Cache frequently accessed data. Load secondary panels and charts asynchronously.

### Performance: Pagination or Virtualization for Large Lists
- **What to check:** Tables and lists with more than 50-100 items use pagination, infinite scroll, or virtual scrolling. Not all items loaded into the DOM at once.
- **Why it matters:** Loading thousands of DOM nodes causes jank, high memory usage, and slow interaction. Virtual scrolling keeps the DOM lightweight regardless of data size.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use pagination for data tables (25-50 items per page). Use virtual scrolling for long lists. Show total count and provide filtering. Load more items on scroll or page change.

### Accessibility: Consistent Focus Management
- **What to check:** When modals open, focus moves into the modal. When modals close, focus returns to the trigger element. Same for dropdowns and popovers.
- **Why it matters:** Without proper focus management, keyboard and screen reader users get lost. Modals without focus trapping allow users to interact with content behind the modal.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Trap focus inside modals. Return focus to the trigger on close. Use aria-modal="true" on modal containers. Test by navigating the entire app with keyboard only.

### Accessibility: Notifications Announced to Screen Readers
- **What to check:** Toast notifications, alerts, and status updates use aria-live regions so screen readers announce them when they appear.
- **Why it matters:** Sighted users see toast notifications; screen reader users need programmatic announcements. Without aria-live, critical feedback (saved, error, success) is invisible.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use role="alert" for errors and warnings. Use aria-live="polite" for success and info messages. Don't overuse — too many live regions create a noisy experience.

### Security: Session Timeout with Warning
- **What to check:** If the session has an inactivity timeout, users receive a warning before being logged out (e.g., "Your session will expire in 2 minutes").
- **Why it matters:** Silent session expiry causes data loss when users return to a form and submit. Warnings give users a chance to extend their session.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Show a modal 2-5 minutes before timeout: "Your session will expire soon. Continue working?" with "Stay Logged In" and "Log Out" buttons. Save form state to prevent data loss.

### Mobile: Responsive Dashboard Layout
- **What to check:** The dashboard adapts to mobile viewports. Sidebar collapses, data cards stack, and tables become scrollable or transform to a card layout.
- **Why it matters:** Even desktop-focused apps see 20-30% mobile traffic. Dashboards that break on mobile frustrate users who check metrics on the go.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Stack dashboard cards vertically on mobile. Collapse sidebar into a hamburger menu. Use horizontal scroll for wide tables or transform to card layouts. Prioritize the most important metric at the top.
