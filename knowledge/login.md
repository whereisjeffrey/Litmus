# Login Page Best Practices

## Overview
The login page is a gateway users pass through repeatedly. Its goal is to get users into the product as quickly as possible with minimal friction. Unlike signup (a one-time event), login happens hundreds of times per user. Speed, convenience, and graceful error handling are paramount. A frustrating login experience degrades the entire product perception.

## Rules

### Fields: Email and Password Only
- **What to check:** The login form uses email (or phone) and password as the only required fields. No additional fields like username, account ID, or security questions on the initial login.
- **Why it matters:** Every additional field slows repeat access. Users already know their email; separate usernames add cognitive load and confusion.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use email as the primary identifier. If the product has usernames, accept either email or username in a single field. Never require both email and username.

### Fields: Remember Me Checkbox
- **What to check:** A "Remember me" or "Stay signed in" checkbox is present, allowing users to persist their session.
- **Why it matters:** 62% of users want to stay logged in on personal devices (NNGroup). Without this option, users must re-enter credentials on every visit, which is especially frustrating on mobile.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a "Remember me" checkbox, checked by default on non-sensitive applications. Set a 30-day session for remembered users. Uncheck by default on financial or health applications.

### Fields: Show/Hide Password Toggle
- **What to check:** An eye icon or "Show" button lets users reveal their password while typing.
- **Why it matters:** Users often mistype passwords (especially on mobile). The toggle reduces login failures by 73% (Nielsen Norman Group). Fewer failures means fewer password resets.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add an eye icon toggle inside the password field. Default to hidden. Ensure it's accessible with aria-label="Show password" / "Hide password."

### Fields: Autofill Enabled
- **What to check:** Form fields have correct autocomplete attributes: autocomplete="email" (or "username") on the email field and autocomplete="current-password" on the password field.
- **Why it matters:** Proper autocomplete attributes enable browser and password manager autofill. This reduces login time to near-zero for returning users with saved credentials.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Set autocomplete="email" on the email field and autocomplete="current-password" on the password field. Don't use autocomplete="off" on login forms — it frustrates users and password managers.

### Fields: Autofocus on Email Field
- **What to check:** The email/username field has autofocus when the page loads, ready for immediate input.
- **Why it matters:** Saves one click and reduces time-to-login. Power users can start typing immediately.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add the autofocus attribute to the email field. Skip autofocus if the page has other interactive elements that might confuse screen readers.

### Error Handling: Ambiguous Error Messages
- **What to check:** Login failure messages do NOT reveal whether the email exists in the system. The message should say "Invalid email or password" not "No account found with this email" or "Incorrect password."
- **Why it matters:** Specific error messages enable account enumeration attacks. Attackers can discover which emails are registered, then target those accounts. This is OWASP Top 10 security guidance.
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Always use "Invalid email or password" regardless of whether the email exists. Apply the same response time to prevent timing attacks. Log failed attempts for security monitoring.

### Error Handling: Failed Attempt Counter with Lockout Warning
- **What to check:** After 3-5 failed login attempts, the user is warned about impending lockout. The system implements progressive delays or temporary lockout.
- **Why it matters:** Brute force protection is essential (OWASP). But locking out without warning frustrates legitimate users who mistyped. Warnings give honest users a chance to recover.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** After 3 failed attempts, show: "2 attempts remaining before temporary lockout." After 5 failures, lock for 15-30 minutes. Send an email alert about suspicious activity. Never permanently lock accounts.

### Error Handling: Password Reset Link Prominent
- **What to check:** A "Forgot password?" link is clearly visible near the password field, not buried in footer text.
- **Why it matters:** 78% of users have reset a password in the last 90 days (HYPR survey). Making reset easy prevents abandonment. Users who can't find the reset link may give up entirely.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Place "Forgot password?" directly below the password field or next to it. Use a standard link style (underlined or colored text). Don't require email re-entry — pre-fill from the login form.

### Error Handling: CAPTCHA Only After Failed Attempts
- **What to check:** CAPTCHA (reCAPTCHA, hCaptcha) does NOT appear on the initial login. It appears only after 2-3 failed attempts or when bot behavior is detected.
- **Why it matters:** CAPTCHAs on every login reduce conversion by 12% (Gartner). Most legitimate users don't need them. Show them only when there's reason to suspect automated access.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Use invisible reCAPTCHA v3 for passive bot detection. Show visible CAPTCHA only after 2-3 failed attempts. Consider honeypot fields as a frictionless alternative.

### Error Handling: Clear Session Expiry Message
- **What to check:** If a user's session expires and they're redirected to login, a clear message explains why (e.g., "Your session has expired. Please log in again.").
- **Why it matters:** Unexplained redirects to the login page confuse users and can feel like a bug or security breach. Clear messaging maintains trust.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Show a non-alarming message above the login form: "Your session has expired. Please log in to continue." Preserve the user's intended destination URL for post-login redirect.

### Convenience: Social Login Matching Signup Options
- **What to check:** Every social login provider available during signup is also available on the login page. No providers are added or removed.
- **Why it matters:** Users forget which method they used to sign up. If Google was available at signup but not at login, Google-authenticated users can't access their accounts.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Mirror social login options exactly between signup and login pages. Show them in the same order and position. Consider adding "You signed up with Google" hints for returning users.

### Convenience: Magic Link Option
- **What to check:** A passwordless "magic link" login option is available — user enters email and receives a login link.
- **Why it matters:** Magic links eliminate password-related friction. They're especially valuable for infrequent users who can't remember passwords. Slack and Medium popularized this pattern.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add a "Send me a login link" option below the password field. Send a time-limited (15-minute) link. Make it clear what will happen: "We'll send a login link to your email."

### Convenience: Biometric Login Support
- **What to check:** On supported devices, biometric authentication (Face ID, Touch ID, Windows Hello) is available as a login method.
- **Why it matters:** Biometric login reduces login time to under 1 second. 67% of users prefer biometrics over passwords (FIDO Alliance survey). It combines convenience with strong security.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Implement WebAuthn/FIDO2 for biometric support. Offer biometric enrollment after a successful password login. Store credentials securely on-device.

### Convenience: SSO for Enterprise Users
- **What to check:** For enterprise/B2B products, Single Sign-On (SAML/OIDC) is supported. An "SSO Login" option or email domain auto-detection routes enterprise users to their IdP.
- **Why it matters:** Enterprise buyers require SSO for security compliance. 90% of enterprise deals require SSO (Replicated survey). Lack of SSO is a deal-breaker for IT teams.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Add "Log in with SSO" option. Implement email domain detection to auto-redirect enterprise users. Support SAML 2.0 and OIDC. Don't gate SSO behind premium tiers if possible.

### Convenience: Post-Login Redirect to Intended Page
- **What to check:** After login, the user is redirected to the page they were trying to access before being sent to login, not always to the dashboard.
- **Why it matters:** Users who click a deep link and get sent to login expect to land on that deep link after authentication. Redirecting to the dashboard forces them to navigate again.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Store the intended URL (return_to parameter) before redirecting to login. After successful login, redirect to the stored URL. Validate the redirect URL to prevent open redirect vulnerabilities.

### Security: HTTPS Required
- **What to check:** The login page is served over HTTPS. HTTP requests are redirected to HTTPS. The form action URL uses HTTPS.
- **Why it matters:** Credentials sent over HTTP are visible to anyone on the network. HTTPS is table stakes for any authentication page.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Enforce HTTPS site-wide. Set up HTTP-to-HTTPS redirects. Use HSTS headers to prevent downgrade attacks.

### Security: No Password in URL Parameters
- **What to check:** The login form uses POST method. Passwords never appear in URL query parameters or GET requests.
- **Why it matters:** URL parameters are logged in browser history, server logs, and analytics. Passwords in URLs are a severe security vulnerability.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Ensure the login form uses method="POST". Never pass credentials via query parameters. Audit analytics tools to ensure they don't capture form data.

### Accessibility: Form Fields Properly Labeled
- **What to check:** Both email and password fields have associated <label> elements or aria-label attributes. The login button is a proper <button> element.
- **Why it matters:** Screen reader users need programmatic labels to navigate the login form. WCAG 2.1 Level A requirement.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use <label for="email">Email</label> with matching input id. Same for password. Ensure the submit button uses <button type="submit"> or <input type="submit">.

### Navigation: Link to Signup for New Users
- **What to check:** A "Don't have an account? Sign up" link is clearly visible on the login page.
- **Why it matters:** New users sometimes land on login pages via bookmarks, links, or search. A clear path to signup prevents them from bouncing.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Place "Don't have an account? Sign up" above or below the login form. Make "Sign up" a prominent link. Use the same placement convention as the "Already have an account?" link on signup.

### Performance: Login Page Loads Fast
- **What to check:** The login page loads in under 2 seconds. Minimal JavaScript and no heavy assets blocking render.
- **Why it matters:** Login is a high-frequency page. Slow login pages waste user time on every visit. Password manager integration depends on quick DOM availability.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Minimize JavaScript on the login page. Inline critical CSS. Avoid loading the entire app bundle just for the login form. Lazy load non-essential assets.
