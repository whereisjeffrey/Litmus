# Universal Best Practices (All Page Types)

## Overview
These rules apply to every page on every website, regardless of page type. They cover accessibility, performance, SEO, mobile usability, and security — the foundational layer that all page-type-specific rules build upon. Failures in these areas affect all users, all the time. These are non-negotiable baselines.

## Rules

### Accessibility: Color Contrast Meets WCAG AA
- **What to check:** Normal text (under 18px) has a contrast ratio of at least 4.5:1 against its background. Large text (18px+ bold or 24px+ normal) has at least 3:1. UI components and graphical objects have at least 3:1.
- **Why it matters:** WCAG 2.1 Level AA requirement. 1 in 12 men and 1 in 200 women have color vision deficiency. Low contrast affects all users in bright ambient light (outdoors, sunlit rooms).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use a contrast checker (WebAIM, Chrome DevTools) to verify all text elements. Avoid light gray text on white (#999 on #fff is 2.85:1 — failing). Dark gray (#333) on white (#fff) is 12.63:1 — passing.

### Accessibility: All Images Have Alt Text
- **What to check:** Every <img> element has an alt attribute. Content images have descriptive alt text. Decorative images use alt="" (empty). No images have missing alt attributes.
- **Why it matters:** WCAG 2.1 Level A requirement (1.1.1 Non-text Content). Screen readers read alt text aloud. Missing alt text makes images invisible to blind users. Also required for SEO.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add descriptive alt text to all content images. Use alt="" (not omitting alt entirely) for decorative images. Don't start with "Image of" — be direct.

### Accessibility: Keyboard Navigation Works
- **What to check:** All interactive elements (links, buttons, form fields, dropdowns, modals) are reachable and operable using only the keyboard (Tab, Enter, Escape, Arrow keys).
- **Why it matters:** WCAG 2.1 Level A requirement (2.1.1 Keyboard). Power users, screen reader users, and users with motor disabilities rely on keyboard navigation. 7.1% of working-age adults have a motor disability.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Use native HTML elements (button, a, input) which are keyboard-accessible by default. Avoid div-based buttons without role="button" and tabindex. Test by navigating the entire page with Tab and Enter.

### Accessibility: Focus Indicators Visible
- **What to check:** When tabbing through elements, a visible focus indicator (outline, ring, or highlight) shows which element is currently focused. Focus indicators are not removed via outline: none without replacement.
- **Why it matters:** WCAG 2.1 Level AA requirement (2.4.7 Focus Visible). Without focus indicators, keyboard users cannot tell where they are on the page. This is one of the most commonly violated accessibility rules.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Never use outline: none or outline: 0 without adding a replacement focus style. Use :focus-visible for modern browsers (avoids showing outlines on mouse click). Make focus indicators high contrast.

### Accessibility: Form Fields Have Labels
- **What to check:** Every form input, select, and textarea has an associated <label> element (via for/id) or aria-label. Placeholder text alone is not sufficient as a label.
- **Why it matters:** WCAG 2.1 Level A requirement (1.3.1 Info and Relationships). Labels tell screen reader users what each field is for. They also increase click target area (clicking the label focuses the field).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add <label for="fieldId">Label Text</label> for every form field. If visual labels are hidden, use aria-label or aria-labelledby. Never use placeholder as the only label.

### Accessibility: Heading Hierarchy Correct
- **What to check:** The page uses headings in logical order (H1 > H2 > H3) without skipping levels. There is exactly one H1 per page. No heading levels are used purely for styling.
- **Why it matters:** WCAG 2.1 Level A (1.3.1). Screen readers provide heading-based navigation — users can jump between headings to scan page structure. Broken hierarchy confuses this navigation.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use one H1 for the main page title. Use H2 for major sections, H3 for subsections. Don't skip levels (H1 to H3). Don't use headings for styling — use CSS classes instead.

### Accessibility: Touch Targets 44x44px Minimum
- **What to check:** All interactive elements (buttons, links, form inputs) have a minimum touch target size of 44x44px (Apple HIG) or 48x48px (Material Design). Adequate spacing between targets.
- **Why it matters:** WCAG 2.1 Level AAA (2.5.5 Target Size) recommends 44x44px. Small targets cause misclicks on touch devices, especially for users with motor impairments. 15% of adults have a motor impairment affecting precision.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set minimum height/width of 44px on buttons and tappable elements. Add at least 8px of spacing between adjacent targets. Use padding rather than small element sizes.

### Accessibility: Screen Reader Compatible
- **What to check:** The page uses semantic HTML elements (nav, main, header, footer, article, section) and ARIA landmarks. Dynamic content changes are announced via aria-live regions.
- **Why it matters:** Semantic HTML and ARIA landmarks enable screen reader users to navigate efficiently. Without landmarks, screen reader users must listen to the entire page linearly.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Use semantic elements: <nav> for navigation, <main> for main content, <header> and <footer> for page structure. Add aria-label to distinguish multiple nav elements. Use aria-live for dynamic content.

### Accessibility: No Information Conveyed by Color Alone
- **What to check:** Information, status, or meaning is not communicated only through color (e.g., red for errors, green for success). An additional indicator (icon, text, pattern) accompanies color.
- **Why it matters:** WCAG 2.1 Level A (1.4.1 Use of Color). 8% of males have some form of color blindness. Red/green deficiency is the most common — error states using only red are invisible to these users.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Pair colors with icons (checkmark for success, X for error), text labels ("Error:", "Success:"), or patterns (strikethrough for unavailable). Test with a color blindness simulator.

### Accessibility: Reduced Motion Respected
- **What to check:** If the page has animations or transitions, it respects the prefers-reduced-motion media query, disabling or minimizing animations for users who request it.
- **Why it matters:** Vestibular disorders affect 35% of adults over 40 (National Institute on Deafness). Animations can cause dizziness, nausea, and disorientation for these users.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Wrap animations in @media (prefers-reduced-motion: no-preference) { }. Or use @media (prefers-reduced-motion: reduce) { } to disable them. Replace motion with opacity transitions.

### Performance: Page Loads Under 3 Seconds
- **What to check:** Total page load time (Time to Interactive) is under 3 seconds on a mid-tier 4G mobile connection. LCP under 2.5s, FID under 100ms, CLS under 0.1.
- **Why it matters:** 53% of mobile users abandon sites that take over 3 seconds (Google). Each additional second reduces conversions by 7% (Akamai). Core Web Vitals are a Google ranking factor.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Optimize images (compression, modern formats, lazy loading). Minimize and defer JavaScript. Use a CDN. Enable GZIP/Brotli compression. Set a performance budget.

### Performance: Images Optimized and Appropriately Sized
- **What to check:** Images are compressed, use modern formats (WebP/AVIF where supported), and are served at appropriate dimensions (not a 4000px image displayed at 400px).
- **Why it matters:** Images account for 50-70% of page weight on most sites. Unoptimized images are the #1 cause of slow page loads. Serving oversized images wastes bandwidth.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Compress all images. Use WebP with JPEG/PNG fallback. Set explicit width and height. Use srcset for responsive sizing. Keep individual images under 200KB.

### Performance: Lazy Loading on Below-Fold Images
- **What to check:** Images below the initial viewport use loading="lazy" (native lazy loading) or equivalent JavaScript-based lazy loading.
- **Why it matters:** Loading all images upfront wastes bandwidth and delays meaningful content. Lazy loading can reduce initial page weight by 40-70% on image-heavy pages.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add loading="lazy" to all below-fold images. Don't lazy load above-fold images (they're the LCP element). Use native lazy loading for simplicity and performance.

### Performance: No Render-Blocking Resources
- **What to check:** CSS and JavaScript files in the <head> don't block page rendering. Critical CSS is inlined, non-critical CSS is deferred, and JavaScript uses defer or async attributes.
- **Why it matters:** Render-blocking resources delay First Contentful Paint. Every blocking resource adds network round-trip time to the visible page load.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Inline critical CSS. Load non-critical CSS with media="print" and onload switch. Add defer to all non-critical <script> tags. Use async for independent scripts.

### Performance: Font Loading Optimized
- **What to check:** Custom fonts use font-display: swap or optional. Fonts are preloaded if critical. No more than 2-3 font families loaded.
- **Why it matters:** Unoptimized fonts cause Flash of Invisible Text (FOIT), hiding content for seconds. Each font file adds 20-100KB and a network request.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use font-display: swap in @font-face. Preload the primary font: <link rel="preload" as="font" crossorigin>. Limit to 2 families, 3-4 weights. Subset fonts to needed characters.

### Performance: GZIP or Brotli Compression Enabled
- **What to check:** The server sends compressed responses (Content-Encoding: gzip or br) for text-based resources (HTML, CSS, JS, SVG, JSON).
- **Why it matters:** Compression reduces transfer size by 60-80%. It's the single easiest performance improvement, yet 15% of sites still don't enable it.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Enable GZIP or Brotli (preferred — 15-20% smaller than GZIP) at the server or CDN level. Verify with DevTools Network tab (check Content-Encoding header).

### SEO: Title Tag Present and Properly Sized
- **What to check:** The page has a <title> tag that is 50-60 characters long, descriptive, and unique to the page.
- **Why it matters:** The title tag is the most important on-page SEO element. It appears as the clickable headline in search results. Missing or duplicate titles reduce search visibility.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Write a unique, descriptive title for every page. Include primary keyword near the start. Keep under 60 characters (Google truncates longer titles). Format: "[Page Topic] | [Brand]".

### SEO: Meta Description Present and Properly Sized
- **What to check:** The page has a <meta name="description"> tag with 150-160 characters of compelling, unique content.
- **Why it matters:** Meta descriptions appear as the snippet in search results. Compelling descriptions increase CTR. Missing descriptions cause Google to auto-generate (often suboptimal) snippets.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Write a unique 150-160 character description. Include primary keyword. Make it compelling with a CTA or benefit statement. Don't duplicate across pages.

### SEO: Open Graph Tags Complete
- **What to check:** The page includes Open Graph meta tags: og:title, og:description, og:image, og:url, og:type at minimum.
- **Why it matters:** Open Graph tags control how the page appears when shared on social media (Facebook, LinkedIn, Slack, iMessage). Missing OG tags result in blank or ugly previews.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add og:title (page title), og:description (1-2 sentence summary), og:image (1200x630px image), og:url (canonical URL), og:type (website/article). Add twitter:card for Twitter/X.

### SEO: Viewport Meta Tag Set
- **What to check:** The page has <meta name="viewport" content="width=device-width, initial-scale=1"> in the <head>.
- **Why it matters:** Without viewport meta, mobile browsers render the page at desktop width and scale down, making text unreadable. It's required for Google's mobile-friendliness assessment.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Add <meta name="viewport" content="width=device-width, initial-scale=1"> to every page's <head>. Don't use maximum-scale=1 or user-scalable=no (blocks pinch-to-zoom, violates accessibility).

### SEO: Canonical URL Correct
- **What to check:** The page has a <link rel="canonical"> tag pointing to its preferred URL. Self-referencing canonicals are acceptable and recommended.
- **Why it matters:** Canonical tags prevent duplicate content penalties when pages are accessible via multiple URLs (www/non-www, HTTP/HTTPS, trailing slash, query parameters).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a canonical tag on every page. Point to the preferred version (HTTPS, www or non-www, no tracking parameters). For paginated content, canonical to self (not page 1).

### SEO: Robots.txt Accessible
- **What to check:** The site has a /robots.txt file that is accessible (returns 200). It doesn't accidentally block important pages or the entire site.
- **Why it matters:** An inaccessible robots.txt or one that blocks crawlers prevents search engine indexing. A misconfigured robots.txt is a common cause of "site disappeared from Google" issues.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Ensure /robots.txt exists and returns 200. Don't Disallow: / (blocks everything). Allow essential paths. Include a Sitemap: directive pointing to your XML sitemap.

### SEO: Structured Data Present
- **What to check:** The page includes appropriate Schema.org structured data (JSON-LD format) relevant to the page type (WebSite, Organization, Article, Product, etc.).
- **Why it matters:** Structured data enables rich results in search engines (ratings, prices, FAQs). Rich results increase CTR by 20-30%. Google increasingly relies on structured data for understanding.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add JSON-LD structured data in the <head>. Use the appropriate Schema.org type. Validate with Google Rich Results Test. Include at minimum: Organization (homepage), Article (blog), Product (e-commerce).

### Mobile: Responsive at All Breakpoints
- **What to check:** The page renders correctly at common viewport widths: 375px (phone), 768px (tablet), 1024px (small desktop), 1440px (desktop), 1920px (large desktop). No broken layouts.
- **Why it matters:** 60%+ of web traffic is mobile. Responsive design is a Google ranking factor. Broken layouts at any breakpoint lose users.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Test at all common breakpoints. Use CSS flexbox/grid for layout. Set breakpoints at 768px, 1024px, and 1440px. Fix any overflow, overlap, or content cutoff issues.

### Mobile: Touch Targets Properly Sized
- **What to check:** Buttons, links, and interactive elements are at least 44x44px on mobile. Adjacent targets have at least 8px of spacing.
- **Why it matters:** Google's mobile usability test flags small touch targets. Users misclick small targets, leading to frustration and accidental navigation. 18% of mobile users report misclick issues.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set min-height: 44px (ideally 48px) on all tappable elements. Use padding to increase tap area without visual enlargement. Space adjacent targets by at least 8px.

### Mobile: No Horizontal Scroll
- **What to check:** No horizontal scrollbar appears on mobile viewports. All content fits within the viewport width.
- **Why it matters:** Horizontal scrolling on mobile is a critical usability failure. It indicates broken responsive design. Users do not expect or look for horizontal content on mobile.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Set max-width: 100% on images and media. Use overflow-x: hidden cautiously (it hides the symptom, not the cause). Find and fix the element causing overflow (often wide images, tables, or code blocks).

### Mobile: Text Readable Without Zoom
- **What to check:** Body text renders at 16px equivalent or larger on mobile. Users do not need to pinch-to-zoom to read content.
- **Why it matters:** Google flags text too small to read in mobile usability tests. It's also a poor experience — users shouldn't have to work to read your content.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set font-size: 16px as a minimum for body text. Use rem or em units that scale with user preferences. Don't use maximum-scale=1 in the viewport meta (allow zooming for accessibility).

### Mobile: Forms Usable on Mobile
- **What to check:** Form fields are full-width on mobile, inputs are at least 44px tall, labels are visible, and the appropriate mobile keyboard appears for each input type.
- **Why it matters:** Forms that are difficult on mobile directly reduce conversions. Mobile form completion rates are 50% lower than desktop when forms aren't mobile-optimized.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Make inputs full-width on mobile. Set min-height: 48px. Use 16px+ font-size to prevent iOS zoom. Use type="email", type="tel", inputmode="numeric" for appropriate keyboards.

### Security: HTTPS Everywhere
- **What to check:** The entire site is served over HTTPS. HTTP requests redirect to HTTPS. No mixed content (HTTP resources loaded on HTTPS pages).
- **Why it matters:** HTTPS is a Google ranking factor. Browsers mark HTTP sites as "Not Secure." HTTPS protects user data in transit. Mixed content can be blocked by browsers.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Obtain and install an SSL certificate (free via Let's Encrypt). Set up HTTP to HTTPS redirects. Fix mixed content by updating all resource URLs to HTTPS. Enable HSTS.

### Security: No Mixed Content
- **What to check:** An HTTPS page does not load any resources (images, scripts, stylesheets, iframes) over HTTP.
- **Why it matters:** Mixed content is blocked by modern browsers (scripts) or shows security warnings (images). It undermines the security of HTTPS. Google Chrome shows "Not Secure" for mixed content.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Audit all resource URLs on HTTPS pages. Update HTTP URLs to HTTPS. Use protocol-relative URLs (//) or absolute HTTPS URLs. Set Content-Security-Policy: upgrade-insecure-requests as a safety net.

### Security: Content Security Policy Headers
- **What to check:** The server sends a Content-Security-Policy (CSP) header that restricts script sources, frame sources, and other resource origins.
- **Why it matters:** CSP prevents Cross-Site Scripting (XSS) attacks — the #1 web vulnerability (OWASP). It restricts which scripts can run, mitigating the impact of injected malicious code.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Start with a report-only CSP to audit current resource origins. Gradually tighten: restrict script-src to 'self' and known CDNs. Avoid 'unsafe-inline' and 'unsafe-eval'. Monitor CSP reports.

### Security: No Sensitive Data in URLs
- **What to check:** URLs do not contain sensitive information: passwords, API keys, tokens, personal data, or session IDs in query parameters.
- **Why it matters:** URLs are logged in browser history, server logs, analytics tools, and referrer headers. Sensitive data in URLs is trivially exposed to third parties.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use POST for sensitive form data. Use HTTP headers (Authorization, Cookie) for tokens. Use path parameters or body data instead of query strings for sensitive values.

### Security: X-Frame-Options or Frame-Ancestors Set
- **What to check:** The server sends X-Frame-Options: DENY (or SAMEORIGIN) or CSP frame-ancestors directive to prevent clickjacking.
- **Why it matters:** Without frame protection, the page can be embedded in a malicious iframe for clickjacking attacks — tricking users into clicking hidden elements.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set X-Frame-Options: DENY in response headers if the page should never be framed. Use SAMEORIGIN if framing within the same site is needed. Prefer CSP frame-ancestors for newer browsers.

### General: 404 Page Exists and is Helpful
- **What to check:** Navigating to a nonexistent URL shows a custom 404 page with navigation, search, and a link to the homepage — not a default server error or blank page.
- **Why it matters:** Custom 404 pages retain 35% of users who would otherwise leave (HubSpot). A helpful 404 page turns a dead end into a navigation opportunity.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Create a custom 404 page with: the site navigation, a search bar, popular links, and a friendly message. Don't return a 200 status for 404 pages (soft 404 — bad for SEO).

### General: Favicon Present
- **What to check:** The page has a favicon defined (link rel="icon") that displays in browser tabs, bookmarks, and mobile home screens.
- **Why it matters:** Missing favicons cause 404 errors in server logs and look unprofessional. Favicons help users identify tabs when multiple are open.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Create a favicon in multiple sizes (16x16, 32x32, 180x180 for Apple). Use <link rel="icon"> in the <head>. Include apple-touch-icon for iOS. Use SVG favicon for modern browsers.

### General: No Console Errors
- **What to check:** The browser console shows no JavaScript errors, failed resource loads, or deprecation warnings on page load.
- **Why it matters:** Console errors indicate broken functionality. Failed resource loads may mean missing images, scripts, or styles. Errors can compound, causing cascading failures.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Open DevTools Console on every page. Fix all red errors. Address 404s for resources. Update deprecated API usage. Test across browsers (Chrome, Firefox, Safari).

### General: Language Attribute Set
- **What to check:** The <html> element has a lang attribute with the correct language code (e.g., lang="en", lang="fr").
- **Why it matters:** WCAG 2.1 Level A requirement (3.1.1 Language of Page). Screen readers use the lang attribute to select pronunciation rules. Translation tools use it to detect the source language.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add lang="en" (or appropriate language) to the <html> element. For multilingual pages, use lang attributes on specific elements that differ from the page language.

### General: Print Stylesheet Considered
- **What to check:** The page has a print stylesheet or @media print rules that optimize the page for printing (hide navigation, format content for paper).
- **Why it matters:** 27% of users still print web pages (Smashing Magazine survey). Without print styles, pages print with navigation, ads, and broken layouts.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add @media print rules: hide navigation, sidebar, and footer. Expand all collapsed content. Use dark text on white background. Show full URLs for links. Test with Print Preview.
