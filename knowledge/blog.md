# Blog / Article Page Best Practices

## Overview
Blog and article pages are the primary vehicle for content marketing and organic search traffic. Their goal is to deliver value to the reader, build authority, and guide visitors toward conversion. Success means high readability, low bounce rate, good time-on-page, and eventual conversion to newsletter subscribers, leads, or customers. Well-optimized article pages are the top organic traffic source for most websites.

## Rules

### Readability: Body Font Size 16px or Larger
- **What to check:** The body text font size is at least 16px. On desktop, 18-20px is preferred for long-form content.
- **Why it matters:** Text below 16px causes eye strain and reduces reading time. 16px is the minimum for comfortable reading on screens (WCAG recommendation). Increasing to 18px can improve reading time by 14% (Smashing Magazine study).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set body text to 16-20px depending on the typeface. Serif fonts can be slightly larger (18-20px). Sans-serif fonts read well at 16-18px.

### Readability: Line Height 1.5-1.7
- **What to check:** The line-height (leading) of body text is between 1.5 and 1.7 relative to the font size.
- **Why it matters:** Line height below 1.3 makes text feel cramped and difficult to track. Line height above 2.0 makes text feel disconnected. The 1.5-1.7 range optimizes reading speed and comprehension (Dyslexia-friendly typography research).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set line-height: 1.6 for body text. Headings can use tighter spacing (1.2-1.3). Adjust for the specific typeface — some fonts need more leading than others.

### Readability: Maximum Line Length 65-75 Characters
- **What to check:** The content column width limits lines to approximately 65-75 characters (including spaces). Typically this means a max-width of 680-750px for body text.
- **Why it matters:** Lines longer than 75 characters cause readers to lose their place when moving to the next line. The optimal range is 50-75 characters (Robert Bringhurst, "The Elements of Typographic Style").
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set a max-width on the content container (650-750px). Don't let text span the full viewport on wide screens. Center the content column for balance.

### Readability: Sufficient Paragraph Spacing
- **What to check:** Paragraphs have visible vertical spacing between them (margin-bottom of at least 1em, ideally 1.5em).
- **Why it matters:** Insufficient paragraph spacing makes text look like a wall. Adequate spacing helps readers chunk information and reduces cognitive load.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Set margin-bottom: 1.5em on paragraphs. Use slightly more space before headings (2-3em) to create clear section breaks.

### Readability: Subheadings Every 2-3 Paragraphs
- **What to check:** The article uses subheadings (H2, H3) to break up content, with no more than 300 words between subheadings.
- **Why it matters:** 79% of web users scan rather than read (NNGroup). Subheadings serve as entry points for scanners and improve comprehension by 12% for all readers.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add descriptive subheadings every 200-300 words. Make subheadings scannable — a reader should understand the article's structure from subheadings alone.

### Readability: High Contrast Text
- **What to check:** Body text has a contrast ratio of at least 4.5:1 against the background (WCAG AA). Avoid light gray text on white backgrounds.
- **Why it matters:** Low contrast text causes eye strain and is inaccessible to users with low vision. 1 in 12 men have some form of color blindness.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use near-black text (#333 or darker) on white/light backgrounds. Test with a contrast checker tool. Avoid gray body text lighter than #555.

### Engagement: Estimated Reading Time Displayed
- **What to check:** An estimated reading time (e.g., "5 min read") is displayed near the article title or byline.
- **Why it matters:** Reading time sets expectations and reduces bounce. Medium found that articles showing reading time had 40% higher engagement. Users are more likely to commit when they know the time investment.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Calculate reading time at ~200-250 words per minute. Display near the title, date, or author. Round to the nearest minute. For articles under 2 minutes, consider "Quick read."

### Engagement: Table of Contents for Long Articles
- **What to check:** Articles longer than 7 minutes (~1,500 words) include a table of contents (TOC) with anchor links to each section.
- **Why it matters:** TOCs improve navigation for long content. They reduce bounce rate by 15% on long articles (Siege Media data). Google sometimes uses TOC links as sitelinks in search results.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Auto-generate a TOC from H2/H3 headings. Place it after the introduction. Make it sticky on desktop (sidebar) or collapsible on mobile. Use smooth scroll for anchor links.

### Engagement: Social Sharing Buttons Present
- **What to check:** Social sharing buttons (Twitter/X, LinkedIn, Facebook, or platform-appropriate options) are available on the article page.
- **Why it matters:** Easy sharing amplifies content reach. Articles with sharing buttons get 7x more social mentions (AddThis data). But intrusive sharing bars hurt readability.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Place sharing buttons either floating on the left sidebar (desktop) or at the top/bottom of the article (mobile). Don't use a fixed bar that covers content. Include the top 3-4 relevant platforms only.

### Engagement: Related Articles at the End
- **What to check:** After the article content, a section shows 3-6 related articles to keep the reader engaged.
- **Why it matters:** Related content recommendations reduce bounce rate by 10-20% (HubSpot). They increase pages per session and time on site, which signals quality to search engines.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Show 3-6 related articles with thumbnails and titles. Use content-based recommendations (same category, similar topics), not just recency. Place after the article but before comments.

### Engagement: Author Bio with Photo
- **What to check:** An author byline with name, photo, and brief bio appears at the top or bottom of the article.
- **Why it matters:** Author attribution builds trust and E-E-A-T (Google's Experience, Expertise, Authoritativeness, Trustworthiness). Articles with author bios get 42% more social engagement (Orbit Media).
- **Detection:** hybrid
- **Severity:** warning
- **Fix:** Include author name and photo at the top (byline) and a full bio at the bottom. Link to the author's profile page. Include credentials relevant to the topic.

### Engagement: Comments or Discussion Section
- **What to check:** If comments are supported, they are moderated and functional. If not supported, a clear alternative (link to community, Twitter discussion) is provided.
- **Why it matters:** Comments increase time-on-page by 25% (Disqus data). They signal active community and can improve SEO through user-generated content.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** If enabling comments, use moderation and spam filtering. If disabling, add "Discuss on Twitter" or "Join the conversation in our community." Don't leave a broken comment section.

### Engagement: Newsletter Signup Contextual
- **What to check:** A newsletter or email signup prompt is relevant to the content and positioned after the reader has engaged (mid-article or end), not as an immediate popup.
- **Why it matters:** Contextual CTAs convert 3x better than generic ones (HubSpot). A reader who just finished an article is primed to subscribe for more.
- **Detection:** hybrid
- **Severity:** info
- **Fix:** Place a newsletter CTA after the article content or as a gentle inline prompt mid-article. Make the value proposition specific: "Get weekly UX tips" not just "Subscribe to our newsletter."

### SEO: Proper Heading Hierarchy
- **What to check:** The article uses a single H1 (the title), followed by H2 for main sections, and H3 for subsections. No skipped levels (H1 to H3 without H2).
- **Why it matters:** Proper heading hierarchy is critical for SEO and accessibility. Screen readers use headings for navigation. Google uses heading structure to understand content hierarchy.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Use exactly one H1 per page (the article title). Use H2 for major sections. Use H3 for subsections within an H2. Never skip heading levels. Don't use headings for styling.

### SEO: Meta Description Unique to Article
- **What to check:** Each article has a unique meta description of 150-160 characters that summarizes the article's key takeaway.
- **Why it matters:** Unique meta descriptions improve CTR from search results. Duplicate or missing descriptions cause Google to auto-generate snippets, which are often suboptimal.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Write a unique 150-160 character description for each article. Include the primary keyword. Make it compelling enough to click. Don't duplicate the first paragraph.

### SEO: Canonical URL Set
- **What to check:** The article has a <link rel="canonical"> tag pointing to its definitive URL.
- **Why it matters:** Canonical tags prevent duplicate content issues when the same article is accessible via multiple URLs (www/non-www, http/https, pagination parameters).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set the canonical URL to the preferred version of the article URL. Self-referencing canonicals are best practice. Ensure syndicated content points the canonical back to the original.

### SEO: Schema.org Article Markup
- **What to check:** The article includes structured data (JSON-LD) with Schema.org Article, BlogPosting, or NewsArticle markup including headline, author, datePublished, dateModified, and image.
- **Why it matters:** Structured data enables rich results in Google Search (article cards, knowledge panels). Articles with schema markup get 20-30% more clicks (Search Engine Journal).
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Add JSON-LD structured data in the <head>. Include: @type (Article/BlogPosting), headline, author (with name), datePublished, dateModified, image, publisher. Validate with Google's Rich Results Test.

### SEO: Image Alt Text on All Images
- **What to check:** Every <img> element has a descriptive alt attribute. Decorative images use alt="" (empty alt).
- **Why it matters:** Alt text is required for WCAG accessibility and helps Google understand images. Articles with alt text on all images rank higher in Google Image Search.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Write descriptive alt text that conveys the image's content and function. For screenshots, describe what's shown. For charts, summarize the key data point. Don't start with "Image of..."

### SEO: URL Slug is Clean and Descriptive
- **What to check:** The article URL uses a clean slug with keywords (e.g., /blog/checkout-page-best-practices) not IDs or timestamps (/blog/post-12345 or /blog/2026/03/31/post).
- **Why it matters:** Clean URLs improve SEO and user trust. Users and search engines can infer content from the URL. Clean URLs get 25% more clicks in search results (Backlinko).
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Use lowercase, hyphen-separated keywords in the URL slug. Remove stop words (the, and, of). Keep under 60 characters. Don't change URLs after publishing without a redirect.

### Performance: Images Optimized
- **What to check:** Article images are compressed, appropriately sized (not 4000px wide displayed at 700px), and use modern formats (WebP, AVIF) where supported.
- **Why it matters:** Images are typically 50-70% of article page weight. Unoptimized images are the #1 cause of slow blog pages. Google penalizes slow pages in search rankings.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Compress images to under 200KB each. Serve at the display size (not larger). Use srcset for responsive images. Use WebP with JPEG fallback. Lazy load below-fold images.

### Performance: Lazy Loading on Below-Fold Images
- **What to check:** Images below the initial viewport use loading="lazy" or equivalent lazy loading mechanism.
- **Why it matters:** Lazy loading reduces initial page weight and LCP time. Articles with 5+ images benefit significantly — initial load can be reduced by 50-70%.
- **Detection:** deterministic
- **Severity:** info
- **Fix:** Add loading="lazy" to all images below the fold. Don't lazy load the first image (it's likely the LCP element). Use native lazy loading (loading="lazy") for simplicity.

### Mobile: Readable Without Zoom
- **What to check:** Article text is readable on mobile devices without requiring pinch-to-zoom. Font size renders at 16px+ equivalent.
- **Why it matters:** 60%+ of blog traffic is mobile. If users have to zoom to read, they'll leave. Google's mobile-friendliness test checks for this.
- **Detection:** deterministic
- **Severity:** critical
- **Fix:** Set viewport meta tag. Use responsive font sizes. Ensure the content column is 100% width on mobile. Test on real devices at 375px width.

### Mobile: Images Responsive
- **What to check:** Images scale down properly on mobile screens. No images extend beyond the viewport causing horizontal scroll.
- **Why it matters:** Oversized images on mobile cause horizontal scrolling, which is one of the worst mobile UX issues. They also waste bandwidth.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Set img { max-width: 100%; height: auto; } globally. Use srcset for resolution-appropriate images. Test on narrow viewports.

### Content Quality: Publication Date Visible
- **What to check:** The article displays a publication date (and ideally a "last updated" date for evergreen content).
- **Why it matters:** Users judge content freshness by publication date. Google considers content freshness for ranking. Articles without dates feel untrustworthy.
- **Detection:** deterministic
- **Severity:** warning
- **Fix:** Display the publication date near the title. For regularly updated articles, show "Last updated: [date]" to signal freshness. Use datetime attributes for machine readability.
