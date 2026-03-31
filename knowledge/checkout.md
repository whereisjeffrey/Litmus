# Checkout Page Best Practices

## Overview
The checkout page is where purchase intent converts to revenue. Its primary goal is to minimize friction between "I want to buy this" and "I bought it." Success means a high completion rate with minimal abandonment. The average cart abandonment rate is ~70% (Baymard Institute, 2024), meaning most optimization effort here yields outsized returns.

## Rules

### Form Design: Minimize Field Count
- **What to check:** Total number of visible form fields across all checkout steps. Benchmark is 7 fields across 3 steps or fewer.
- **Why it matters:** Each additional field reduces completion by approximately 10%. The average US checkout has 23 form elements but only needs 7 (Baymard Institute, 2024 Checkout UX study).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Remove optional fields or move them behind a toggle. Combine first/last name if possible. Use address autocomplete to reduce address fields.

### Form Design: Guest Checkout Available
- **What to check:** Can a user complete purchase without creating an account? Look for a "Guest Checkout" or "Continue as Guest" option.
- **Why it matters:** 24% of users abandon checkout when forced to create an account (Baymard Institute, 2024). Forced account creation is the #2 reason for abandonment.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Offer guest checkout prominently. Optionally offer account creation AFTER purchase completion with a "Save your info for next time?" prompt.

### Form Design: Single Column Layout
- **What to check:** Form fields are arranged in a single column, not side-by-side (except logically paired fields like first/last name or city/state/zip).
- **Why it matters:** Multi-column form layouts produce 22% more errors because users misread the visual flow (CXL Institute research). Eye-tracking shows users skip fields in multi-column layouts.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Stack all fields vertically. The only acceptable side-by-side fields are first/last name, expiry month/year, and city/state/zip groupings.

### Form Design: Inline Validation Present
- **What to check:** Fields validate as the user types or on blur, not only on form submit. Check for real-time feedback elements adjacent to inputs.
- **Why it matters:** Inline validation reduces errors by 22% and increases completion rates by 31% (Luke Wroblewski, "Inline Validation in Web Forms" study). Users correct mistakes immediately rather than hunting through a list of errors.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Validate on blur (not on every keystroke). Show green checkmarks for valid fields. Show red with specific error message for invalid fields. Never validate an empty field before the user interacts with it.

### Form Design: Clear Error Messages
- **What to check:** Error messages are specific, visible, and placed near the problematic field. Not generic messages like "Please fix errors" at the top of the page.
- **Why it matters:** 67% of users who encounter a confusing error message abandon the form entirely (UX Movement). Specific error messages reduce re-submission attempts by 50%.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Place error text directly below the field. Use red text with an icon. Be specific: "Enter a 5-digit ZIP code" not "Invalid input." Never use alert() dialogs for form errors.

### Form Design: Auto-Format Inputs
- **What to check:** Credit card numbers auto-format with spaces (4242 4242 4242 4242). Phone numbers auto-format. Expiration dates auto-insert slash.
- **Why it matters:** Auto-formatting reduces input errors and cognitive load. Credit card numbers without spaces cause 30% more typos (Baymard Institute).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use input masking libraries. Format credit cards in groups of 4. Auto-insert slash for MM/YY. Format phone numbers as the user types.

### Form Design: Progress Indicator for Multi-Step
- **What to check:** If checkout spans multiple pages/steps, a progress bar or step indicator is visible showing current position and remaining steps.
- **Why it matters:** Progress indicators reduce perceived effort and increase completion by 10-15% (Nielsen Norman Group). Users are more likely to complete a process when they can see the end.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show numbered steps (e.g., "Step 2 of 3: Shipping") or a progress bar. Label each step. Allow clicking back to previous steps.

### Form Design: Shipping and Billing Address Toggle
- **What to check:** A "Same as shipping" checkbox or toggle that auto-fills billing address from shipping address.
- **Why it matters:** Reduces field count by 5-7 fields for the majority of customers whose addresses match. 60-70% of orders ship to the billing address (Baymard Institute).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Default to "Same as shipping address" checked. Only show billing fields when unchecked. Pre-populate from any saved addresses.

### Form Design: Address Autocomplete
- **What to check:** Typing in the address field triggers autocomplete suggestions (Google Places API, Loqate, or similar).
- **Why it matters:** Address autocomplete reduces input time by 20% and address errors by 60% (Google). Fewer delivery failures and returns.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Integrate an address autocomplete service. Populate city, state, and ZIP automatically from the selected suggestion.

### Cost Transparency: Shipping Costs Visible Before Final Step
- **What to check:** Shipping cost is shown before the user reaches the final "Place Order" step. Ideally visible on the cart page or first checkout step.
- **Why it matters:** Unexpected shipping costs are the #1 reason for cart abandonment — 48% of users abandon for this reason (Baymard Institute, 2024). Hidden costs destroy trust.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Show shipping cost (or "Free Shipping") on the cart page. If shipping depends on address, show an estimate or range. Display "Shipping calculated at next step" as a minimum.

### Cost Transparency: Tax Calculation Shown Early
- **What to check:** Sales tax or VAT is visible before the final payment step, not added as a surprise at the end.
- **Why it matters:** 23% of users abandon when the total cost is higher than expected (Baymard Institute). Tax surprises at the last step feel deceptive.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Calculate estimated tax as soon as the shipping address is entered. Show "Estimated tax" with the amount. For international sites, include VAT in displayed prices where legally required.

### Cost Transparency: No Surprise Fees at Last Step
- **What to check:** No handling fees, service charges, or other costs appear for the first time on the final confirmation step.
- **Why it matters:** Surprise fees are the top driver of cart abandonment. 49% of users cite "extra costs too high" as the reason for abandoning (Baymard Institute, 2024).
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Disclose all fees on the cart page or first checkout step. If fees are unavoidable, explain them clearly (e.g., "Handling fee for oversized items: $5.99").

### Cost Transparency: Order Summary Always Visible
- **What to check:** An order summary panel (items, quantities, prices, subtotal, shipping, tax, total) is visible on every checkout step.
- **Why it matters:** Users want to verify their order at every stage. A persistent summary reduces anxiety and back-navigation by 18% (UX research, Baymard).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Display a sticky or collapsible order summary sidebar (desktop) or expandable section (mobile). Include item thumbnails, names, quantities, and line prices.

### Cost Transparency: Discount Code Field Visible but Not Prominent
- **What to check:** A coupon/discount code field exists but does not dominate the layout. Ideally collapsed behind a "Have a promo code?" link.
- **Why it matters:** A prominent empty coupon field causes 27% of users to leave the checkout to search for codes, and 8% never return (Baymard Institute). But hiding it entirely frustrates users who have codes.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Use a text link ("Have a promo code?") that expands to reveal the field. Do not make it a full-width input that screams "you're missing a discount."

### Trust & Security: SSL Badge Visible
- **What to check:** A visible SSL/security badge or lock icon appears near the payment form, not just in the browser bar.
- **Why it matters:** 17% of users have abandoned a purchase because they didn't trust the site with credit card info (Baymard Institute). Visual security indicators reduce anxiety.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Display a recognizable security badge (Norton, McAfee Secure, SSL padlock) near the credit card fields. Ensure HTTPS is active site-wide.

### Trust & Security: Payment Method Icons Shown Early
- **What to check:** Visa, Mastercard, Amex, PayPal, Apple Pay, and other accepted payment logos are visible before the user reaches the payment step.
- **Why it matters:** Seeing accepted payment methods early reduces anxiety. 6% of users abandon because their preferred payment method wasn't available (Baymard Institute).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Display payment method icons in the cart, checkout header, or on the first checkout step. Show only methods you actually accept.

### Trust & Security: Money-Back Guarantee Displayed
- **What to check:** A money-back guarantee, satisfaction guarantee, or similar assurance is visible on the checkout page.
- **Why it matters:** Guarantees reduce perceived risk. Sites with visible guarantees see 10-15% higher conversion (VWO case studies).
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Display a brief guarantee statement near the CTA (e.g., "30-day money-back guarantee"). Include a link to the full policy.

### Trust & Security: Trust Badges Present
- **What to check:** Third-party trust badges (BBB, Trustpilot rating, Norton Secured, etc.) appear on the checkout page.
- **Why it matters:** Trust seals increase conversions by 42% on average (Actual Insights / BlueFountain Media split test). They're especially important for lesser-known brands.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place 2-3 recognizable trust badges near the payment section. Avoid using so many that they clutter the page. Link them to verification pages.

### Trust & Security: Return Policy Linked
- **What to check:** A link to the return/refund policy is visible on the checkout page, even if just in a footer or near the CTA.
- **Why it matters:** 12% of users abandon because the return policy is unsatisfactory or not visible (Baymard Institute). Visibility reduces anxiety even if users don't click.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a brief line like "Free returns within 30 days" with a link to the full policy. Place it near the order total or CTA button.

### Trust & Security: Contact Information Visible
- **What to check:** Phone number, email, or live chat option is accessible from the checkout page.
- **Why it matters:** Visible contact info increases trust. 44% of online shoppers say having a live person available during checkout is important (Forrester Research).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Show a phone number or chat widget on the checkout page. Even a "Need help?" link to a contact page is better than nothing.

### Payment: Multiple Payment Methods Available
- **What to check:** At least 2-3 payment methods are supported (credit card + at least one alternative like PayPal, Apple Pay, Google Pay, or Buy Now Pay Later).
- **Why it matters:** 6% of users abandon because of insufficient payment options (Baymard). Alternative payment methods reduce friction for users who don't want to enter card details.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Offer credit/debit cards plus PayPal at minimum. Add Apple Pay and Google Pay for mobile users. Consider Buy Now Pay Later (Klarna, Afterpay) for higher-priced items.

### Payment: Card Number Auto-Detection
- **What to check:** Entering a card number automatically detects and displays the card brand (Visa, Mastercard, Amex) icon.
- **Why it matters:** Brand detection provides visual confirmation the number is being entered correctly. It catches mistyped numbers earlier and reduces cognitive load.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Detect card brand from the first 4-6 digits (Visa starts with 4, Mastercard 5, Amex 3). Display the corresponding icon. Adjust CVV field length for Amex (4 digits vs 3).

### Payment: Saved Payment for Returning Customers
- **What to check:** Returning logged-in customers can select a previously saved payment method rather than re-entering card details.
- **Why it matters:** Reducing input for returning customers increases repeat purchase conversion by 15-20% (Stripe data). It also reduces errors.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Offer to save payment during first purchase. Show saved cards with last 4 digits and expiry. Allow adding new methods alongside saved ones.

### Payment: Clear CTA with Total Amount
- **What to check:** The final "Place Order" button includes the total amount (e.g., "Pay $47.99" or "Place Order — $47.99").
- **Why it matters:** Showing the total in the button removes the final moment of doubt. Users know exactly what they're committing to (EU law requires this for compliance).
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Include the order total in the submit button text. Use action-oriented language: "Pay $47.99" or "Complete Purchase — $47.99."

### Payment: Express Checkout Options
- **What to check:** Express payment options (Apple Pay, Google Pay, Shop Pay) appear at the top of checkout for a one-click experience.
- **Why it matters:** Express checkout can reduce checkout time by 40% and increase mobile conversion by 12% (Shopify data, 2023).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place express checkout buttons at the top of the checkout flow with a divider ("or continue below"). Support the major platforms for your audience.

### Technical: Form Autocomplete Attributes Present
- **What to check:** All form fields have appropriate HTML autocomplete attributes (e.g., autocomplete="cc-number", autocomplete="shipping street-address").
- **Why it matters:** Autocomplete reduces form fill time by 30% (Google Chrome data). Browsers can only autofill when fields are properly annotated.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add autocomplete attributes to every field: "name", "email", "tel", "street-address", "address-level2" (city), "address-level1" (state), "postal-code", "country", "cc-name", "cc-number", "cc-exp", "cc-csc".

### Technical: Input Types Correct
- **What to check:** Input fields use the correct HTML type attribute: type="email" for email, type="tel" for phone, inputmode="numeric" for card numbers and ZIP.
- **Why it matters:** Correct input types trigger the appropriate mobile keyboard, reducing errors. type="tel" shows a numeric keypad, which is critical for card numbers on mobile.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use type="email" for email, type="tel" for phone. For card numbers, use inputmode="numeric" with pattern. For ZIP, use inputmode="numeric" on US sites.

### Technical: Tab Order Logical
- **What to check:** Pressing Tab moves focus through form fields in the expected visual order (top to bottom, left to right).
- **Why it matters:** Broken tab order confuses keyboard users and violates WCAG 2.1 (2.4.3 Focus Order). It also breaks screen reader flow and slows down power users.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Ensure DOM order matches visual order. Avoid using positive tabindex values. Test by tabbing through the entire form.

### Technical: Back Button Preserves Data
- **What to check:** Pressing the browser back button from a later checkout step returns to the previous step with all entered data preserved.
- **Why it matters:** 15% of users use the back button during checkout (Baymard Institute). Losing entered data causes frustration and abandonment.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Store form state in sessionStorage or URL state. Use the History API for multi-step checkouts. Test browser back/forward navigation at every step.

### Technical: Mobile-Friendly Input Sizes
- **What to check:** Input fields are at least 44px tall (Apple HIG) / 48px (Material Design). Font size inside inputs is at least 16px (prevents iOS zoom on focus).
- **Why it matters:** Small inputs cause misclicks and frustration on mobile. Font size below 16px triggers iOS Safari to zoom in on focus, breaking the layout.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set min-height: 48px on all inputs. Set font-size to 16px or larger inside form fields. Ensure adequate spacing between tap targets.

### Technical: Loading State on Submit
- **What to check:** The submit/pay button shows a loading state (spinner, "Processing...") after click and disables to prevent double submission.
- **Why it matters:** Without a loading state, users click multiple times, potentially creating duplicate orders. This costs businesses $2.5B annually in duplicate charges (Stripe estimate).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** On click: disable the button, replace text with spinner and "Processing...", prevent form resubmission. Re-enable only on error.

### Technical: Minimal JavaScript Dependencies
- **What to check:** The checkout page does not load unnecessary third-party scripts (heavy analytics, chat widgets, marketing pixels) that slow down the page.
- **Why it matters:** Each additional second of load time on checkout reduces conversions by 7% (Akamai). Checkout needs to be the fastest page on the site.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Audit third-party scripts on checkout. Defer non-essential scripts. Remove chat widgets unless they serve a support function during checkout.

### Accessibility: Form Labels on All Fields
- **What to check:** Every input field has an associated <label> element or aria-label. Placeholder text alone is not sufficient.
- **Why it matters:** Required for WCAG 2.1 (1.3.1 Info and Relationships). Placeholder-only labels disappear on input, causing users to forget what the field is for.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use visible <label> elements with for= matching the input id. If using floating labels, ensure they remain visible after the field is filled.

### Accessibility: Error Announcements
- **What to check:** Form errors are announced to screen readers via aria-live regions or aria-describedby on the affected field.
- **Why it matters:** Screen reader users cannot see visual error indicators. Without aria announcements, they may not know submission failed or which field to fix.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use aria-describedby to link error messages to their fields. Use role="alert" or aria-live="polite" for error summary sections.

### Mobile: Sticky CTA on Mobile
- **What to check:** On mobile viewports, the primary "Place Order" / "Continue" button is fixed to the bottom of the screen or always visible.
- **Why it matters:** On mobile, users frequently can't find the submit button because it's below the fold after long forms. Sticky CTAs increase mobile checkout completion by 8-12%.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Fix the CTA button to the bottom of the viewport on mobile. Ensure it doesn't obscure error messages or the last form field.

### Mobile: Mobile-Optimized Keyboard
- **What to check:** Tapping numeric fields (card number, phone, ZIP) opens the numeric keyboard on mobile devices.
- **Why it matters:** Opening a full QWERTY keyboard for numeric input slows entry and increases errors. The right keyboard type reduces input time by 30-40%.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use inputmode="numeric" for card numbers, CVV, and ZIP codes. Use type="tel" for phone numbers. Use type="email" for email addresses.

### Abandonment Recovery: Exit Intent Handling
- **What to check:** Some form of exit-intent detection or abandoned cart recovery mechanism is present (email capture, exit popup, or at minimum, cart persistence).
- **Why it matters:** Exit-intent overlays can recover 3-5% of abandoning users (OptinMonster data). Cart persistence via cookies means users can return later.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** At minimum, persist the cart in localStorage/cookies for 7-30 days. Optionally use exit-intent overlays with an incentive. Send abandoned cart emails if the email has been collected.

### Abandonment Recovery: Cart Persistence
- **What to check:** If a user leaves and returns, their cart contents are preserved (via cookies, localStorage, or server-side session).
- **Why it matters:** 56% of shoppers expect to return to a saved cart (Google/Ipsos). Losing cart contents forces users to start over, and many won't.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Save cart state server-side for logged-in users and in localStorage for guests. Persist for at least 7 days. Merge carts if a guest later logs in.

### Psychological: Urgency and Scarcity Indicators
- **What to check:** If urgency or scarcity elements are used (stock counts, countdown timers), they are truthful and not fabricated.
- **Why it matters:** Fake urgency erodes trust. Real urgency ("Only 3 left in stock") can increase conversion by 9% (Marcus Taylor study). But if customers catch deception, it's brand-damaging.
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Only show real inventory counts. Avoid fake countdown timers. If using urgency, tie it to genuine constraints (limited stock, sale end date).

### Psychological: Confirmation and Thank You Page
- **What to check:** After successful purchase, a confirmation page appears with order number, summary, estimated delivery date, and next steps.
- **Why it matters:** The confirmation page reduces post-purchase anxiety. It also reduces "Did my order go through?" support tickets by up to 30%.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Show order number prominently. Summarize items, total, and shipping address. Provide estimated delivery date. Include a link to track the order and contact support.
