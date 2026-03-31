# Landing Page Best Practices

## Overview
A landing page is a standalone page designed for a specific campaign or conversion goal. Unlike a homepage, it has one job: convert visitors into leads or customers. Success is measured by conversion rate (typically 2-5% average, 10%+ for top performers). The page should clearly communicate value, build trust, and drive a single action.

## Rules

### Above the Fold: Value Proposition Clear Within 5 Seconds
- **What to check:** The headline and subheadline clearly communicate what the product/service does and who it's for. A first-time visitor should understand the core offer within 5 seconds.
- **Why it matters:** Users form their first impression in 50ms (Google Research, 2012) and decide to stay or leave within 5-10 seconds. Unclear value propositions are the #1 reason landing pages fail (Unbounce, 2023).
- **Detection:** AI-required
- **Severity:** critical
- **Fix:** Use the formula: "We help [audience] achieve [outcome] by [method]." The headline should address the visitor's problem. The subheadline should explain how you solve it.

### Above the Fold: Single Primary CTA Visible Without Scrolling
- **What to check:** One clear call-to-action button is visible in the initial viewport on both desktop and mobile without scrolling.
- **Why it matters:** Pages with a single CTA have 13.5% higher conversion than pages with multiple competing CTAs (Unbounce Conversion Benchmark Report). Above-fold CTA visibility is correlated with 20% higher conversion.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Place one prominent CTA button in the hero section. Make it large enough to be immediately visible. Remove or de-emphasize competing actions above the fold.

### Above the Fold: Headline Addresses a Pain Point
- **What to check:** The H1 headline speaks to a specific problem, desire, or outcome rather than just describing the product.
- **Why it matters:** Problem-focused headlines convert 28% better than product-descriptive headlines (MarketingExperiments). Users are driven by their pain, not your features.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Rewrite from the user's perspective. Instead of "Project Management Software" use "Stop Missing Deadlines — Ship Projects On Time." Lead with the outcome, not the tool.

### Above the Fold: Subheadline Explains How
- **What to check:** The subheadline (text immediately below the H1) explains the mechanism or approach, not just restates the headline.
- **Why it matters:** The headline grabs attention; the subheadline keeps it. Subheadlines that explain "how" generate 30% more engagement (Copyhackers research).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Use the subheadline to answer "How does it work?" in one sentence. Include a specific differentiator or method.

### Above the Fold: Hero Image or Video Relevant to Value Prop
- **What to check:** The hero visual (image, video, or illustration) directly relates to the product, service, or outcome being promised.
- **Why it matters:** Relevant hero images increase conversion by 40% compared to generic stock photos (VWO case study). Irrelevant visuals confuse the message.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Show the product in use, the outcome achieved, or the target audience. Avoid generic stock photos of smiling people. Screenshots, demos, or before/after visuals work well.

### Above the Fold: No Slider or Carousel in Hero
- **What to check:** The hero section does not use a rotating carousel or slider for key messages.
- **Why it matters:** Only 1% of users interact with carousels, and 89% of those only click the first slide (Notre Dame University study). Carousels dilute messaging and slow page load.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Choose the single strongest message for the hero. If you have multiple value props, stack them vertically down the page rather than rotating them.

### CTA Design: CTA Text is Specific and Action-Oriented
- **What to check:** The CTA button text uses specific, value-driven language ("Start Free Trial", "Get My Report", "See Pricing") rather than generic labels ("Submit", "Click Here", "Learn More").
- **Why it matters:** Specific CTAs convert 42% better than generic ones (HubSpot A/B test data). First-person CTAs ("Start My Free Trial") outperform third-person by 24% (Unbounce).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Use first-person, benefit-oriented text. Include what the user gets: "Get Your Free Guide", "Start My 14-Day Trial", "See Plans & Pricing."

### CTA Design: CTA Stands Out Visually
- **What to check:** The primary CTA button has high contrast against the background, sufficient size (minimum 44x44px), and adequate whitespace around it.
- **Why it matters:** A CTA that blends in gets ignored. Color contrast and size are the two biggest factors in CTA visibility (Eyequant eye-tracking data). CTAs with surrounding whitespace get 20% more clicks.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use a contrasting color for the CTA (not used elsewhere on the page). Make the button at least 44px tall (ideally 50-60px). Add at least 20px of whitespace on all sides.

### CTA Design: Secondary CTA Does Not Compete
- **What to check:** If a secondary CTA exists (e.g., "Watch Demo" alongside "Start Free Trial"), it is visually subordinate — smaller, outlined, or ghost-styled.
- **Why it matters:** Two equally prominent CTAs create decision paralysis (Hick's Law). Clear visual hierarchy between primary and secondary CTAs increases primary CTA clicks by 17%.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Make the secondary CTA a text link or ghost button (outlined, no fill). Keep it adjacent to the primary CTA but visually lighter.

### CTA Design: No More Than 2 CTAs Above the Fold
- **What to check:** The above-fold area contains at most 2 CTAs (one primary, one optional secondary). No additional buttons compete for attention.
- **Why it matters:** Each additional choice above the fold reduces conversion of the primary CTA. Pages with 1 CTA have the highest conversion rates (Unbounce Conversion Benchmark).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Remove or relocate tertiary actions (social links, about links, blog links) to below the fold. Keep the hero focused on the primary conversion action.

### CTA Design: CTA Repeated After Key Sections
- **What to check:** The primary CTA is repeated after major sections (after social proof, after feature benefits, at page bottom) so users don't have to scroll back up.
- **Why it matters:** Users who read deeper into the page are more engaged and more likely to convert, but only if a CTA is nearby. Repeated CTAs on long pages increase conversion by 20% (Neil Patel, 2022).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place a CTA after every 2-3 sections of content. Repeat the same primary CTA — don't introduce new actions. Ensure the final section ends with a strong CTA.

### Social Proof: Testimonials or Logos Visible Near Fold
- **What to check:** Customer testimonials, client logos, review scores, or other social proof elements appear within the first 1-2 viewports.
- **Why it matters:** 72% of consumers say positive testimonials increase their trust (BigCommerce). Social proof near the fold increases conversion by 34% (WikiJob A/B test).
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Place a logo bar or testimonial directly below the hero section. Use recognizable brand logos if possible. Show 3-5 logos, not 20.

### Social Proof: Specific Results in Testimonials
- **What to check:** Testimonials include measurable outcomes ("Increased our conversion by 34%" or "Saved 10 hours per week") rather than vague praise ("Great product!").
- **Why it matters:** Specific, quantifiable results are 68% more persuasive than generic praise (Conversion Rate Experts research). They provide concrete reasons to believe.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Ask customers for specific metrics. Structure testimonials as: problem, solution, result. Include the metric in bold or larger text.

### Social Proof: Real Names and Photos on Testimonials
- **What to check:** Testimonials include the person's full name, job title, company, and photo. Not anonymous or first-name-only.
- **Why it matters:** Testimonials with photos are 34% more effective (OptinMonster). Full attribution signals authenticity. Anonymous testimonials feel fabricated.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Include headshot, full name, title, and company. Link to LinkedIn profiles if possible. Video testimonials are even stronger.

### Social Proof: Number of Users or Customers Displayed
- **What to check:** A specific count of users, customers, or other quantifiable social proof is visible (e.g., "Join 50,000+ teams" or "4.8 stars from 2,000+ reviews").
- **Why it matters:** Specific numbers create a bandwagon effect. Pages showing user counts convert 15% higher (ContentVerve split test).
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Display the actual number of customers, users, downloads, or reviews. Update regularly. Even small numbers can work: "Trusted by 500 agencies."

### Social Proof: Third-Party Review Badges
- **What to check:** Badges from review platforms (G2, Capterra, Trustpilot, Product Hunt) are displayed if the product has favorable ratings.
- **Why it matters:** Third-party reviews are 3x more trusted than self-reported testimonials (BrightLocal). Platform badges provide independent verification.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Embed badges from G2, Capterra, or Trustpilot showing your rating. Place near the fold or in the social proof section. Link to the full review profile.

### Navigation: Minimal Navigation (Max 7 Items)
- **What to check:** The navigation bar contains 7 or fewer items. Ideally, landing pages have reduced or no navigation.
- **Why it matters:** Hick's Law: decision time increases logarithmically with the number of choices. Each nav link is a potential exit. Landing pages with no navigation convert 28% higher than those with full nav (VWO).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** For dedicated landing pages, remove navigation entirely or limit to logo + CTA. For pages that serve dual purposes, limit to 5-7 essential items.

### Navigation: CTA in Navigation Bar
- **What to check:** The primary CTA ("Sign Up", "Get Started") appears as a button in the top navigation, visible at all scroll positions if the header is sticky.
- **Why it matters:** A nav CTA provides a persistent conversion opportunity. It's especially effective on long pages where the hero CTA scrolls out of view.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a styled button (not just a text link) for the primary CTA in the right side of the navigation bar. Make it match the hero CTA styling.

### Navigation: Sticky Header on Long Pages
- **What to check:** If the page requires scrolling (more than 2 viewports), the header/navigation sticks to the top of the viewport on scroll.
- **Why it matters:** Sticky headers with a CTA provide a persistent conversion opportunity. They improve navigation efficiency by 22% (Hyunjin Song & Thomas Schwarz, Usability study, 2014).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Implement a sticky header that appears on downward scroll. Include the primary CTA button. Consider a slim header that's smaller than the original to save vertical space.

### Navigation: Mobile Hamburger Menu
- **What to check:** On mobile viewports, navigation collapses into a hamburger menu or similar compact pattern.
- **Why it matters:** Full navigation bars on mobile consume valuable above-fold space and push content down. Mobile users expect hamburger menus (Nielsen Norman Group).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Collapse nav items into a hamburger menu at tablet breakpoint (~768px). Keep the primary CTA visible alongside the hamburger icon. Ensure the menu is easily tappable (44px+ target).

### Content Flow: Problem-Solution-Proof-CTA Structure
- **What to check:** The page follows the persuasion sequence: identify the problem, present the solution, prove it works, then ask for action.
- **Why it matters:** This structure mirrors the buyer's decision-making process. Landing pages that follow this framework convert 2-3x better than feature-dump pages (Copyhackers).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Structure the page as: (1) Hero with problem/solution headline, (2) Features as benefits, (3) Social proof and case studies, (4) Objection handling / FAQ, (5) Final CTA.

### Content Flow: Feature Benefits Not Just Feature Descriptions
- **What to check:** Features are presented with their benefit to the user, not just described technically. Each feature answers "so what?"
- **Why it matters:** Benefit-focused copy converts 28% better than feature-focused copy (MarketingExperiments). Users buy outcomes, not features.
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** For every feature, add "so that you can..." or "which means...". Example: Instead of "256-bit encryption" use "256-bit encryption so your data is always safe."

### Content Flow: Visual Hierarchy Guides the Eye
- **What to check:** The page uses clear visual hierarchy: large headlines, medium subheadlines, smaller body text. Key elements (CTA, social proof) are visually prominent.
- **Why it matters:** Users scan before they read. 79% of users scan any new page (Nielsen Norman Group). Clear hierarchy guides scanning toward conversion elements.
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Use 3-4 distinct type sizes. Make headings 1.5-2x the body text size. Use bold, color, and whitespace to create focal points. Test by squinting — key elements should still stand out.

### Content Flow: Adequate White Space Between Sections
- **What to check:** Sections are separated by visible white space (60-120px padding). Content doesn't feel cramped.
- **Why it matters:** White space increases comprehension by 20% (Wichita State University study). Breathing room between sections helps users process information.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add 80-120px padding between major sections. Use at least 40px between sub-sections. Ensure text blocks have 1.5+ line height.

### Content Flow: No Walls of Text
- **What to check:** No text block exceeds 3-4 lines without a visual break (subheading, bullet list, image, or paragraph break).
- **Why it matters:** Large text blocks are skipped by 79% of scanners (Nielsen Norman Group). Breaking up text increases reading by 58%.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Break long paragraphs into 2-3 sentence chunks. Use bullet points for lists. Add subheadings every 2-3 paragraphs. Include supporting visuals.

### Content Flow: Objection Handling Section
- **What to check:** The page addresses common objections or concerns (price, difficulty, time commitment, risk) either inline or in a FAQ section.
- **Why it matters:** Unaddressed objections are silent conversion killers. Pages that proactively handle the top 3-5 objections convert 30% higher (Copyhackers).
- **Detection:** AI-required
- **Severity:** warning
- **Fix:** Add a section addressing "But what if..." concerns. Use FAQ format or weave objection handling into testimonials and feature descriptions. Address price, time, and risk at minimum.

### Performance: Hero Image Optimized
- **What to check:** Hero image file size is under 200KB (ideally under 100KB). Uses modern formats (WebP, AVIF) with fallbacks.
- **Why it matters:** The hero image is typically the Largest Contentful Paint (LCP) element. Google recommends LCP under 2.5 seconds. Unoptimized heroes are the #1 cause of slow landing pages.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Compress hero images to under 200KB. Use WebP or AVIF with JPEG fallback. Set explicit width and height to prevent layout shifts. Preload the hero image in the <head>.

### Performance: LCP Under 2.5 Seconds
- **What to check:** Largest Contentful Paint occurs within 2.5 seconds on a mid-tier mobile device.
- **Why it matters:** LCP is a Google Core Web Vital and a ranking factor. Pages with LCP over 2.5s see 24% higher bounce rates (Google Web Vitals report, 2023).
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Optimize LCP element (usually hero image or headline). Preload critical resources. Minimize render-blocking CSS/JS. Use a CDN.

### Performance: No Layout Shifts During Load
- **What to check:** Cumulative Layout Shift (CLS) is under 0.1. Elements don't jump around as the page loads.
- **Why it matters:** CLS is a Core Web Vital. Layout shifts cause misclicks and frustration. Pages with CLS above 0.1 have 15% higher bounce rates (Google data).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set explicit width/height on images and iframes. Reserve space for dynamic content (ads, embeds). Preload fonts. Avoid injecting content above existing content.

### Performance: Fonts Loaded Efficiently
- **What to check:** Custom fonts use font-display: swap or optional. Font files are preloaded. No more than 2-3 font families loaded.
- **Why it matters:** Font loading can cause Flash of Invisible Text (FOIT), hiding content for seconds. Each additional font family adds 100-300ms to load time.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use font-display: swap in @font-face. Preload primary fonts with <link rel="preload">. Limit to 2 font families and 3-4 weights total. Consider system fonts for body text.

### Form Design: Minimal Form Fields
- **What to check:** Lead capture forms have 3-5 fields maximum. Email-only forms are preferred for top-of-funnel pages.
- **Why it matters:** Reducing form fields from 4 to 3 increases conversion by 50% (Imagescape). Each field adds friction. For landing pages, less is dramatically more.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** For lead gen: name + email is sufficient. For free trials: email only. Ask for additional info after initial conversion through progressive profiling.

### Trust: Privacy Policy Linked Near Form
- **What to check:** A link to the privacy policy is visible near the email capture form or CTA. Brief privacy assurance text is present ("We'll never share your email").
- **Why it matters:** GDPR compliance requires it in many jurisdictions. Beyond compliance, privacy assurance near forms increases completion by 19% (Unbounce).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add a brief line below the form: "We respect your privacy. Unsubscribe anytime." Link to the full privacy policy. Use a small lock icon for visual reinforcement.

### Mobile: Mobile-First Layout
- **What to check:** The page renders properly on mobile devices with no horizontal scrolling, readable text without zoom, and tap-friendly buttons.
- **Why it matters:** 60%+ of landing page traffic is mobile (StatCounter, 2024). Mobile-unfriendly pages lose the majority of their audience.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Test on real mobile devices, not just browser resize. Ensure CTA buttons are full-width on mobile. Use 16px+ body text. Stack columns vertically.

### Mobile: Thumb-Friendly CTA Placement
- **What to check:** On mobile, the primary CTA is within the natural thumb zone (center-bottom of screen) and at least 48px tall.
- **Why it matters:** 75% of mobile users interact with their thumb (Steven Hoober research). CTAs in hard-to-reach zones get fewer taps.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Place CTAs in the center or lower portion of the screen on mobile. Use full-width buttons. Ensure minimum 48px height with 8px padding between adjacent targets.
