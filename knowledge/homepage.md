# Homepage Best Practices

## Overview
The homepage is the front door to a website. It serves multiple audiences (new visitors, returning users, different buyer personas) and must quickly communicate who you are, what you do, and why it matters. Success means visitors understand the value proposition within seconds and find a clear path to their next action. The homepage typically receives the most traffic and the widest range of intent.

## Rules

### First Impression: What the Company Does is Clear in 5 Seconds
- **What to check:** A first-time visitor can understand what the company/product does within 5 seconds. The H1 headline and hero section communicate the core offering.
- **Why it matters:** Users form first impressions in 50ms (Google/University of Basel, 2006). 55% of visitors spend fewer than 15 seconds on a page (Chartbeat). If the value prop isn't instant, visitors leave.
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Write a headline that answers "What is this and why should I care?" in one sentence. Avoid jargon and vague platitudes ("Empowering innovation" means nothing). Be specific and benefit-focused.

### First Impression: Target Audience Obvious
- **What to check:** The homepage makes it clear who the product/service is for — either explicitly ("For small business owners") or implicitly through language, imagery, and context.
- **Why it matters:** Visitors who don't feel like the target audience bounce immediately. Specificity builds trust: "Built for e-commerce teams" is stronger than "Built for everyone."
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Include audience-specific language in the headline or subheadline. Show industry-relevant imagery. Use "for [audience]" phrasing or show recognizable customer logos from the target segment.

### First Impression: Primary Action Clear
- **What to check:** One primary CTA is visually prominent in the hero section, guiding the most desired user action.
- **Why it matters:** A homepage without a clear primary action becomes a passive brochure. Pages with a single clear CTA convert 13.5% higher than those with multiple competing actions (Unbounce).
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Define one primary action (Sign Up, Start Free Trial, Book a Demo). Make it the most prominent button on the page. Secondary actions should be visually subordinate.

### First Impression: Professional Trustworthy Appearance
- **What to check:** The design is polished, consistent, and modern. No broken images, misaligned elements, placeholder text, or amateur design patterns.
- **Why it matters:** 75% of users judge a company's credibility based on website design (Stanford Web Credibility Research). Visual quality signals business quality.
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Use consistent typography, color scheme, and spacing. Ensure all images load correctly. Align elements to a grid. Remove placeholder or Lorem Ipsum text.

### First Impression: Hero Section is Not a Carousel
- **What to check:** The hero section uses a single, focused message rather than a rotating carousel.
- **Why it matters:** Carousels have ~1% interaction rate and most users only see the first slide (Notre Dame University study). They dilute the message and slow page load.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Choose the single most important message for the hero. If multiple messages are needed, stack them vertically below the fold rather than rotating them.

### Navigation: 5-7 Main Nav Items Maximum
- **What to check:** The primary navigation contains 5-7 top-level items. Not more than 7 to avoid decision overload.
- **Why it matters:** Hick's Law: every additional choice increases decision time. Navigation with 5-7 items has 20% higher task completion than navigation with 10+ items (NNGroup).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Consolidate related items under dropdown menus. Prioritize the 5-7 most important destinations. Move less important links to the footer.

### Navigation: Search Available for Content-Heavy Sites
- **What to check:** If the site has more than ~50 pages of content, a search function is available (search icon in the header).
- **Why it matters:** 30% of users prefer search over navigation (NNGroup). On content-heavy sites, search is the fastest path to specific information.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Add a search icon in the header. Implement site-wide search with relevant results. Consider auto-suggest for common queries. Show search prominently on mobile.

### Navigation: Contact/Support Easy to Find
- **What to check:** A link to contact information or support is accessible within 2 clicks from the homepage. Ideally in the header, footer, or both.
- **Why it matters:** Users who need help and can't find it leave. Visible contact info builds trust. 44% of visitors will leave if there's no contact information (KoMarketing).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Include "Contact" or "Support" in the main navigation or header. Add phone number and email in the footer. Consider a sticky chat widget for real-time support.

### Navigation: Mobile Navigation Accessible
- **What to check:** On mobile viewports, navigation collapses into a hamburger menu or similar compact pattern. The menu is easily openable and closeable.
- **Why it matters:** 60%+ of web traffic is mobile. Full desktop navigation on mobile pushes content below the fold and creates a cluttered experience.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Collapse nav into a hamburger menu at ~768px. Keep the CTA button visible alongside the hamburger icon. Ensure the mobile menu is scrollable for many items.

### Navigation: Logo Links to Homepage
- **What to check:** The company logo in the header is a clickable link that navigates to the homepage.
- **Why it matters:** This is a universal web convention. 88% of users expect the logo to link home (NNGroup). Breaking this convention causes confusion.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Wrap the logo in an <a href="/"> tag. Ensure the logo has alt text with the company name.

### Content: Most Important Content Above the Fold
- **What to check:** The value proposition, primary CTA, and one trust element (social proof or credential) are visible without scrolling on both desktop and mobile.
- **Why it matters:** 80% of attention is spent above the fold (NNGroup). Content below the fold is seen by fewer users, so critical conversion elements must be above it.
- **Detection:** hybrid
- **Severity:** critical
- **Fix:** Place headline, subheadline, primary CTA, and a trust element (logo bar, testimonial, or stat) in the hero section. Test on common viewport sizes (1366x768 desktop, 375x667 mobile).

### Content: Clear Paths for Different User Types
- **What to check:** The homepage provides distinct paths for different visitor types (e.g., "For Developers" vs "For Managers", or "Personal" vs "Business").
- **Why it matters:** A one-size-fits-all approach fails when visitors have different needs. Segmented paths increase engagement by 20-30% (HubSpot).
- **Detection:** AI-required
- **Severity:** info
- **Fix:** Add cards or sections for each user type with tailored messaging and CTAs. Use audience-specific language that resonates with each segment.

### Content: Social Proof Present
- **What to check:** Customer logos, testimonials, review scores, user counts, or media mentions are visible on the homepage.
- **Why it matters:** Social proof increases conversion by 15-34% depending on type (WikiJob A/B test). New visitors need evidence that others trust the product.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a logo bar ("Trusted by") below the hero. Include 1-2 testimonials with names and photos. Show aggregate stats ("50,000+ users" or "4.8/5 on G2").

### Content: Recent Activity or Updates If Applicable
- **What to check:** For blogs, news sites, or products with regular updates, the homepage shows recent or featured content to demonstrate the site is active.
- **Why it matters:** Stale homepages (copyright 2021, old blog posts) signal abandonment. Fresh content signals an active, maintained product.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Show latest blog posts, changelog entries, or news items. Use relative dates ("2 days ago" not "March 28, 2026"). Auto-update this section.

### Content: No Auto-Playing Video or Audio
- **What to check:** No video or audio plays automatically when the page loads. Auto-play with sound is especially prohibited.
- **Why it matters:** Autoplay is the #1 most disliked web pattern (NNGroup). It violates user control, wastes bandwidth on mobile, and is an accessibility issue. Many browsers now block it.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** All video/audio should be user-initiated (click to play). If auto-play is used for muted background video, ensure it doesn't cause layout shifts and has a pause button.

### Content: Clear Value Differentiation
- **What to check:** The homepage communicates what makes this product/company different from competitors, not just what it does.
- **Why it matters:** In a crowded market, "what you do" is not enough. Users need to understand "why you over competitors." Differentiation reduces comparison shopping behavior.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Include a differentiator in the headline or subheadline. Add a "Why us" section or comparison if appropriate. Focus on unique strengths, not generic claims.

### Footer: Essential Links Present
- **What to check:** The footer includes links to: About, Contact, Privacy Policy, Terms of Service, and sitemap or site directory.
- **Why it matters:** The footer is where users look for secondary information. 72% of users scroll to the footer looking for specific links (Chartbeat). Missing essential links erodes trust and SEO.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Include at minimum: About, Contact, Privacy Policy, Terms of Service. Add social media links, company address, and copyright year. Organize into columns for scannability.

### Footer: Current Copyright Year
- **What to check:** The copyright year in the footer is the current year (2026). Not a past year.
- **Why it matters:** An outdated copyright year signals an unmaintained website. It's a small detail that erodes trust.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use dynamic year rendering (e.g., new Date().getFullYear() in JavaScript). Or update manually each year.

### Performance: Page Loads Under 3 Seconds
- **What to check:** The homepage fully loads and becomes interactive within 3 seconds on a 4G mobile connection.
- **Why it matters:** 53% of mobile users abandon sites that take over 3 seconds to load (Google). Every additional second reduces conversions by 7% (Akamai).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Optimize images (WebP, compression). Minimize JavaScript. Use a CDN. Lazy load below-fold content. Set a performance budget.

### Performance: No Intrusive Interstitials
- **What to check:** The homepage does not immediately show a full-screen popup, modal, or interstitial on first load (newsletter signup, cookie banner blocking content, etc.).
- **Why it matters:** Google penalizes intrusive interstitials on mobile (Page Experience ranking factor). Full-screen popups on entry bounce 75% of users (Sumo research).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Delay popups by at least 5 seconds or trigger on exit intent. Use banner-style cookie notices, not full-screen overlays. Never block content on first visit.

### SEO: Title Tag Descriptive
- **What to check:** The homepage <title> tag is descriptive, includes the brand name, and is 50-60 characters. Not just the company name.
- **Why it matters:** The title tag is the most important on-page SEO element. It's what appears in search results. A descriptive title increases CTR from search by 20-30%.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Format: "[Primary Keyword] | [Brand Name]" or "[Brand Name] — [Brief Description]." Include the main value prop. Stay under 60 characters.

### SEO: Meta Description Present and Unique
- **What to check:** The homepage has a unique meta description of 150-160 characters that accurately describes the site.
- **Why it matters:** The meta description often appears as the snippet in search results. A compelling description increases CTR from search.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Write a compelling 150-160 character description. Include the primary keyword and a CTA. Make it unique to the homepage.

### Accessibility: Skip to Content Link
- **What to check:** A "Skip to main content" link is the first focusable element on the page, allowing keyboard users to bypass navigation.
- **Why it matters:** Required for WCAG 2.1 Level A (2.4.1 Bypass Blocks). Keyboard and screen reader users shouldn't have to tab through the entire navigation on every page load.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a visually hidden link as the first element in <body> that becomes visible on focus. Link it to the main content area with an id (e.g., <a href="#main-content">Skip to content</a>).

### Accessibility: Language Attribute Set
- **What to check:** The <html> element has a lang attribute set to the correct language code (e.g., lang="en").
- **Why it matters:** Required for WCAG 2.1 Level A (3.1.1 Language of Page). Screen readers use this to select the correct pronunciation rules.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add lang="en" (or appropriate language) to the <html> element. For multilingual sites, update the attribute dynamically.
