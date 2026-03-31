# Signup / Registration Page Best Practices

## Overview
The signup page converts interested visitors into registered users. Its sole goal is to minimize friction between "I want to try this" and "I'm in." Every unnecessary field, confusing label, or extra step loses users. Best-in-class signup pages achieve 30-50% conversion rates. The key principle: collect the minimum information now, gather the rest through progressive profiling later.

## Rules

### Field Count: 3 Fields or Fewer for Initial Signup
- **What to check:** The signup form has 3 or fewer visible fields (typically: name, email, password — or just email and password).
- **Why it matters:** Each additional form field reduces conversion by approximately 10% (Imagescape study). The ideal signup has 1-3 fields. HubSpot found reducing fields from 4 to 3 increased conversion by 50%.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** For SaaS: email + password is sufficient. For personalization needs: first name + email + password. Everything else (company, role, phone, address) can be collected during onboarding.

### Field Count: Phone Number Optional or Absent
- **What to check:** Phone number is not a required field on the signup form. If present, it is clearly marked as optional.
- **Why it matters:** 37% of users abandon signup forms that require a phone number (Baymard Institute). Phone numbers feel invasive and signal unwanted sales calls.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Remove phone number from signup entirely. If needed for 2FA, request it during account setup after initial signup. If included, mark it clearly as "Optional."

### Field Count: Progressive Profiling Used
- **What to check:** Additional user information (company name, role, team size, use case) is collected after initial signup during onboarding, not on the signup form.
- **Why it matters:** Progressive profiling maintains low friction at signup while still collecting the data you need. Companies using progressive profiling see 20% higher signup completion (Marketo).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Collect only essential fields at signup. Create an onboarding flow that collects additional data over the first 1-3 sessions. Ask for one piece of info at a time.

### Field Count: No Redundant Fields
- **What to check:** The form does not ask for both username AND email (unless the product requires usernames). No "confirm email" field. No unnecessary fields like date of birth or gender.
- **Why it matters:** Redundant fields add friction without value. "Confirm email" fields are especially annoying as users just copy-paste, defeating the purpose.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use email as the username. Remove "confirm email" — use email verification instead. Only ask for username if the product requires a public display name.

### Social Login: Google/Apple/GitHub Login Available
- **What to check:** At least one social/OAuth login option is available (Google, Apple, GitHub, Microsoft — depending on the target audience).
- **Why it matters:** Social login reduces signup friction by 50% (Login Radius). It eliminates password creation and reduces form fields to zero clicks. 77% of users prefer social login (Gigya).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Offer Google Sign-In at minimum (largest reach). Add Apple Sign-In (required for iOS apps). Add GitHub for developer tools. Add Microsoft for enterprise products.

### Social Login: Social Login Above Email Form
- **What to check:** Social login buttons appear above or before the email/password form, positioned as the primary signup method.
- **Why it matters:** Social login is faster and has higher completion rates. Placing it first captures users who prefer the lowest-friction path. Below-fold social login gets 30% fewer clicks.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place social login buttons at the top of the signup area. Show email form below with a clear "or" separator. Make social buttons full-width and prominent.

### Social Login: Clear "Or" Separator
- **What to check:** A visual separator with "or" text divides social login options from the email signup form.
- **Why it matters:** Without a separator, users may think they need to do both (social login AND fill the form). A clear "or" communicates these are alternative paths.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use a horizontal line with "or" centered in it (common pattern). Style it subtly — it's a wayfinding element, not a design feature.

### Social Login: Consistent with Login Page
- **What to check:** The same social login options available on signup are also available on the login page. No new options appear or disappear.
- **Why it matters:** Users who sign up with Google expect to log in with Google. Inconsistent options cause "How did I sign up?" confusion and password reset attempts.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Mirror social login options exactly between signup and login pages. If you add a new provider, add it to both pages simultaneously.

### Password: Requirements Shown Upfront
- **What to check:** Password requirements (minimum length, complexity rules) are visible before or as the user starts typing, not only shown after a failed submission.
- **Why it matters:** Showing requirements after failure doubles the time to complete signup. Users feel punished for not knowing the rules. Upfront display reduces password field errors by 60%.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Display requirements below the password field as a checklist. Gray out unmet criteria. Check off criteria in green as the user types. Never use a modal or alert for requirements.

### Password: Strength Meter Visible
- **What to check:** A password strength indicator (weak/medium/strong, colored bar, or similar) is visible while the user types their password.
- **Why it matters:** Strength meters encourage stronger passwords. 70% of users will strengthen their password when they see a strength meter (Google research). This improves account security without adding friction.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add a colored bar (red/yellow/green) below the password field. Update in real-time as the user types. Show text labels ("Weak", "Good", "Strong").

### Password: Show/Hide Password Toggle
- **What to check:** A toggle (eye icon or "Show" button) lets users reveal their password while typing.
- **Why it matters:** Hidden passwords cause typos. Show/hide toggles reduce password entry errors by 73% (NNGroup). They're especially critical on mobile where typing is harder.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add an eye icon toggle inside the password field (right side). Default to hidden. Toggle text between "Show" and "Hide" for screen readers. Apply to both password and confirm password fields.

### Password: No Confirm Password Field
- **What to check:** The form uses a single password field with a show/hide toggle rather than a "Confirm Password" second field.
- **Why it matters:** Confirm password fields are outdated when a show/hide toggle is available. They add a field (reducing completion by ~10%) and users often just copy-paste, making confirmation meaningless.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use a single password field with a show/hide toggle. This provides better UX than confirm password while maintaining accuracy.

### Experience: Success State Clear After Signup
- **What to check:** After successful signup, the user sees a clear confirmation of what happened and what comes next (email verification, onboarding, first action).
- **Why it matters:** A dead-end after signup (blank page, generic "Success!") wastes the moment of highest engagement. Clear next steps reduce drop-off between signup and activation by 25%.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** After signup, either: (1) redirect to an onboarding flow, (2) show a welcome screen with the first action, or (3) show an email verification prompt with clear instructions.

### Experience: Email Verification Process Clear
- **What to check:** If email verification is required, the page clearly explains: what to do, where to check (including spam folder), and provides a resend option.
- **Why it matters:** 10-15% of verification emails go to spam. Without clear instructions and a resend option, these users are permanently lost.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** After signup, show: "Check your email at user@example.com." Add "Check your spam folder" note. Provide a "Resend email" button. Allow changing the email address if mistyped.

### Experience: Redirect to Value
- **What to check:** Post-signup, the user lands in a state that delivers value (pre-populated dashboard, guided first action, sample project) rather than an empty or blank state.
- **Why it matters:** First-time users who experience value within the first session are 3x more likely to become active users (Mixpanel data). An empty dashboard is a dead end.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Pre-populate with sample data. Start a guided setup wizard. Show a "quick start" checklist. Point users to their first meaningful action.

### Experience: Welcome Message Personalized
- **What to check:** The post-signup experience uses the user's name (if collected) and is tailored to their context (plan selected, referral source, use case).
- **Why it matters:** Personalized onboarding increases activation by 10-20% (Intercom data). Users feel recognized rather than processed through a generic funnel.
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Use the user's first name in the welcome heading. If you collected their use case, tailor the onboarding steps. Show relevant templates or presets.

### Form UX: Clear Labels on All Fields
- **What to check:** Every field has a visible label (not just placeholder text). Labels are positioned above the field.
- **Why it matters:** Placeholder-only labels disappear when users start typing, causing confusion. Above-field labels are processed 50ms faster than left-aligned labels (Luke Wroblewski eye-tracking research).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use visible labels above each field. Optionally use floating labels that transition from placeholder to above-field on focus. Never rely on placeholder text alone.

### Form UX: Autofocus on First Field
- **What to check:** When the signup page loads, the cursor is focused in the first form field, ready for input.
- **Why it matters:** Auto-focus saves one click/tap and signals that the form is ready for input. It reduces the time to first interaction by 1-2 seconds.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add the autofocus attribute to the first form field. Ensure this doesn't cause accessibility issues (screen readers should still announce the page context first).

### Form UX: Submit Button Below Last Field
- **What to check:** The submit button is positioned immediately below the last form field, not separated by large whitespace, disclaimers, or other content.
- **Why it matters:** Proximity between the last field and the submit button maintains momentum. Inserting content between them causes hesitation and drop-off.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place the CTA directly below the last field with 16-24px spacing. Move terms/privacy links below the CTA or use inline text ("By signing up, you agree to our Terms").

### Legal: Terms of Service Acceptance
- **What to check:** The signup flow includes a link to Terms of Service and Privacy Policy. Acceptance is implicit ("By signing up, you agree to...") or explicit (checkbox).
- **Why it matters:** Legal compliance requires Terms of Service acceptance. GDPR requires explicit consent in the EU. Missing this creates legal liability.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add text below the CTA: "By creating an account, you agree to our [Terms of Service] and [Privacy Policy]." In the EU, consider an explicit checkbox for GDPR compliance.

### Security: Rate Limiting on Signup
- **What to check:** The signup form has rate limiting to prevent automated mass signups. CAPTCHA appears after suspicious activity.
- **Why it matters:** Unprotected signup forms are targets for bot registrations, spam accounts, and credential stuffing attacks. Rate limiting protects both the service and legitimate users.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Implement invisible reCAPTCHA or hCaptcha. Add server-side rate limiting (e.g., max 5 signups per IP per hour). Show visible CAPTCHA only after suspicious patterns.

### Accessibility: Form Fields Properly Labeled for Screen Readers
- **What to check:** All form fields have associated labels via <label for=""> or aria-label. Social login buttons have descriptive text.
- **Why it matters:** Screen reader users need programmatic labels to understand form fields. WCAG 2.1 Level A requirement (1.3.1 Info and Relationships).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Associate every field with a <label> element. Give social login buttons descriptive aria-labels ("Sign up with Google"). Ensure error messages are linked to fields via aria-describedby.

### Navigation: Link to Login for Existing Users
- **What to check:** A prominent "Already have an account? Log in" link is visible on the signup page.
- **Why it matters:** Users who already have accounts sometimes land on signup. Without a clear path to login, they may attempt to re-register or leave.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Place "Already have an account? Log in" above or below the signup form. Make the "Log in" portion a clear link. Don't hide it in small text.
