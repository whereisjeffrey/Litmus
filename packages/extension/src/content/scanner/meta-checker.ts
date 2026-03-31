import type { MetaInfo, MetaResult, Finding } from "@placeholder/shared";

function getMeta(name: string): string | null {
  const el =
    document.querySelector(`meta[name="${name}"]`) ||
    document.querySelector(`meta[property="${name}"]`);
  return el?.getAttribute("content") || null;
}

/**
 * Checks page metadata: title, description, viewport, OG tags, Twitter Cards,
 * canonical, charset, lang, robots, favicon.
 *
 * Validates:
 * - Title length (50-60 chars ideal)
 * - Description length (150-160 chars ideal)
 * - Open Graph completeness (og:title, og:description, og:image, og:url)
 * - Twitter Card meta tags
 * - Robots meta tag
 * - Canonical URL
 * - Favicon presence
 */
export function checkMeta(): MetaResult {
  const findings: Finding[] = [];

  const title = document.title || null;
  const titleLength = title?.length ?? 0;

  const description = getMeta("description");
  const descriptionLength = description?.length ?? 0;

  const viewportEl = document.querySelector('meta[name="viewport"]');
  const hasViewport = !!viewportEl;
  const viewportContent = viewportEl?.getAttribute("content") || null;

  const hasCharset = !!(
    document.querySelector("meta[charset]") ||
    document.querySelector('meta[http-equiv="Content-Type"]')
  );

  const ogTitle = getMeta("og:title");
  const ogDescription = getMeta("og:description");
  const ogImage = getMeta("og:image");
  const ogUrl = getMeta("og:url");

  const twitterCard = getMeta("twitter:card");
  const twitterTitle = getMeta("twitter:title");
  const twitterDescription = getMeta("twitter:description");
  const twitterImage = getMeta("twitter:image");

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  const canonicalUrl = canonicalEl?.getAttribute("href") || null;

  const faviconEl =
    document.querySelector('link[rel="icon"]') ||
    document.querySelector('link[rel="shortcut icon"]') ||
    document.querySelector('link[rel="apple-touch-icon"]');
  const favicon = faviconEl?.getAttribute("href") || null;

  const lang = document.documentElement.getAttribute("lang");

  const robots = getMeta("robots");

  const meta: MetaInfo = {
    title,
    titleLength,
    description,
    descriptionLength,
    hasViewport,
    viewportContent,
    hasCharset,
    ogTitle,
    ogDescription,
    ogImage,
    ogUrl,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    canonicalUrl,
    favicon,
    lang,
    robots,
  };

  // ── Title checks ──────────────────────────────────────────────────

  if (!title) {
    findings.push({
      id: "meta-no-title",
      scanner: "meta-checker",
      severity: "critical",
      title: "No page title",
      description:
        "Every page needs a <title> tag. It appears in browser tabs, search results, and screen reader announcements.",
      selector: null,
      standard: "WCAG 2.4.2",
    });
  } else if (titleLength < 10) {
    findings.push({
      id: "meta-short-title",
      scanner: "meta-checker",
      severity: "warning",
      title: "Title too short",
      description: `"${title}" may not be descriptive enough. Aim for 50-60 characters for optimal search display.`,
      selector: null,
      standard: null,
    });
  } else if (titleLength > 60) {
    findings.push({
      id: "meta-long-title",
      scanner: "meta-checker",
      severity: "info",
      title: "Title too long",
      description:
        "Search engines typically display the first 50-60 characters. Consider shortening for best visibility.",
      selector: null,
      standard: null,
    });
  }

  // ── Description checks ────────────────────────────────────────────

  if (!description) {
    findings.push({
      id: "meta-no-desc",
      scanner: "meta-checker",
      severity: "warning",
      title: "No meta description",
      description:
        "A meta description helps search engines and social shares. Aim for 150-160 characters.",
      selector: null,
      standard: null,
    });
  } else if (descriptionLength < 50) {
    findings.push({
      id: "meta-short-desc",
      scanner: "meta-checker",
      severity: "info",
      title: "Description too short",
      description: "Aim for 150-160 characters for best search result display.",
      selector: null,
      standard: null,
    });
  } else if (descriptionLength > 160) {
    findings.push({
      id: "meta-long-desc",
      scanner: "meta-checker",
      severity: "info",
      title: "Description too long",
      description:
        "Search engines truncate descriptions over ~160 characters. Consider shortening.",
      selector: null,
      standard: null,
    });
  }

  // ── Essential meta tags ───────────────────────────────────────────

  if (!hasViewport) {
    findings.push({
      id: "meta-no-viewport",
      scanner: "meta-checker",
      severity: "critical",
      title: "No viewport meta",
      description:
        'Without a viewport meta tag, mobile browsers render the page at desktop width. Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
      selector: null,
      standard: null,
    });
  }

  if (!hasCharset) {
    findings.push({
      id: "meta-no-charset",
      scanner: "meta-checker",
      severity: "warning",
      title: "No charset",
      description:
        'Add <meta charset="utf-8"> as the first element in <head> to ensure correct character rendering.',
      selector: null,
      standard: null,
    });
  }

  if (!lang) {
    findings.push({
      id: "meta-no-lang",
      scanner: "meta-checker",
      severity: "critical",
      title: "No lang attribute",
      description:
        'Screen readers need the lang attribute to pronounce content correctly. Add lang="en" (or appropriate language) to the <html> element.',
      selector: null,
      standard: "WCAG 3.1.1",
    });
  }

  // ── Robots meta tag ───────────────────────────────────────────────

  if (robots) {
    const robotsLower = robots.toLowerCase();
    if (robotsLower.includes("noindex")) {
      findings.push({
        id: "meta-robots-noindex",
        scanner: "meta-checker",
        severity: "warning",
        title: "Page set to noindex",
        description:
          "The robots meta tag includes \"noindex\", which prevents search engines from indexing this page. Verify this is intentional.",
        selector: null,
        standard: null,
      });
    }
    if (robotsLower.includes("nofollow")) {
      findings.push({
        id: "meta-robots-nofollow",
        scanner: "meta-checker",
        severity: "info",
        title: "Page uses nofollow",
        description:
          "The robots meta tag includes \"nofollow\", which prevents search engines from following links on this page.",
        selector: null,
        standard: null,
      });
    }
  }

  // ── Open Graph completeness ───────────────────────────────────────

  const ogTags = { ogTitle, ogDescription, ogImage, ogUrl };
  const missingOgTags = Object.entries(ogTags)
    .filter(([, value]) => !value)
    .map(([key]) => key.replace("og", "og:").replace(/([A-Z])/g, (m) => m.toLowerCase()));

  if (missingOgTags.length === 4) {
    findings.push({
      id: "meta-no-og",
      scanner: "meta-checker",
      severity: "info",
      title: "Missing OG tags",
      description:
        "Open Graph tags control how your page appears when shared on social media. Consider adding og:title, og:description, og:image, and og:url.",
      selector: null,
      standard: null,
    });
  } else if (missingOgTags.length > 0 && missingOgTags.length < 4) {
    // Some OG tags present but incomplete
    const missing = missingOgTags.map((t) => {
      // Convert camelCase key back to og: format
      if (t === "ogtitle") return "og:title";
      if (t === "ogdescription") return "og:description";
      if (t === "ogimage") return "og:image";
      if (t === "ogurl") return "og:url";
      return t;
    });
    findings.push({
      id: "meta-og-incomplete",
      scanner: "meta-checker",
      severity: "info",
      title: "Missing OG tags",
      description: `Missing: ${missing.join(", ")}. Complete OG tags ensure consistent social media previews.`,
      selector: null,
      standard: null,
    });
  }

  // ── Twitter Card tags ─────────────────────────────────────────────

  if (!twitterCard) {
    // Only flag if OG tags exist (if they're sharing-aware)
    if (ogTitle || ogDescription) {
      findings.push({
        id: "meta-no-twitter-card",
        scanner: "meta-checker",
        severity: "info",
        title: "No Twitter Card",
        description:
          'Add <meta name="twitter:card" content="summary_large_image"> for rich Twitter/X previews. Twitter falls back to OG tags but the card type must be specified.',
        selector: null,
        standard: null,
      });
    }
  }

  // ── Canonical URL ─────────────────────────────────────────────────

  if (!canonicalUrl) {
    findings.push({
      id: "meta-no-canonical",
      scanner: "meta-checker",
      severity: "info",
      title: "No canonical URL",
      description:
        'A canonical link helps search engines avoid duplicate content issues. Add: <link rel="canonical" href="...">',
      selector: null,
      standard: null,
    });
  } else {
    // Check if canonical URL looks valid
    try {
      const canonical = new URL(canonicalUrl, window.location.href);
      if (canonical.origin !== window.location.origin) {
        findings.push({
          id: "meta-canonical-crossorigin",
          scanner: "meta-checker",
          severity: "warning",
          title: "Cross-origin canonical",
          description: `Canonical URL "${canonicalUrl}" points to a different origin than the current page. Verify this is intentional.`,
          selector: null,
          standard: null,
        });
      }
    } catch {
      findings.push({
        id: "meta-canonical-invalid",
        scanner: "meta-checker",
        severity: "warning",
        title: "Malformed canonical URL",
        description: `Canonical URL "${canonicalUrl}" appears to be malformed.`,
        selector: null,
        standard: null,
      });
    }
  }

  // ── Favicon ───────────────────────────────────────────────────────

  if (!favicon) {
    findings.push({
      id: "meta-no-favicon",
      scanner: "meta-checker",
      severity: "info",
      title: "Missing favicon",
      description:
        "A favicon helps users identify your site in tabs and bookmarks.",
      selector: null,
      standard: null,
    });
  }

  return { meta, findings };
}
