import type { ScanResult, AIAnalysis, QuickWin, Finding, StoryCard } from "@placeholder/shared";
import { PageType } from "@placeholder/shared";

// ─── Hook Line Generation ──────────────────────────────────────────

interface HookCandidate {
  priority: number; // lower = more impactful, chosen first
  line: string;
}

function generateHookCandidates(result: ScanResult): HookCandidate[] {
  const candidates: HookCandidate[] = [];
  const pt = result.pageType;

  // Form field count hook
  const totalFields = result.forms.forms.reduce((sum, f) => sum + f.fieldCount, 0)
    + result.forms.orphanedFields.length;
  if (totalFields > 5) {
    const benchmark = Math.max(3, Math.round(totalFields * 0.6));
    const dropoff = Math.min(40, Math.round((totalFields - benchmark) * 5));
    candidates.push({
      priority: 1,
      line: `Your ${pt} asks for ${totalFields} fields \u2014 top performers in your category average ${benchmark}. You're likely losing ${dropoff}% of completions.`,
    });
  }

  // Critical accessibility issues
  const criticalCount = result.allFindings.filter((f) => f.severity === "critical").length;
  if (criticalCount >= 3) {
    candidates.push({
      priority: 2,
      line: `This ${pt} has ${criticalCount} accessibility violations that could expose you to legal action \u2014 and they're affecting an estimated 15% of your visitors.`,
    });
  }

  // Contrast issues
  if (result.contrast.failingCount > 0) {
    const worstPair = result.contrast.pairs
      .filter((p) => !p.passes)
      .sort((a, b) => a.contrastRatio - b.contrastRatio)[0];
    if (worstPair) {
      const ratio = worstPair.contrastRatio.toFixed(1);
      candidates.push({
        priority: 3,
        line: `Your main call-to-action has a ${ratio}:1 contrast ratio \u2014 25% of users over 50 will struggle to read it.`,
      });
    }
  }

  // Missing alt text
  if (result.images.missingAltCount > 0) {
    const total = result.images.images.length;
    const missing = result.images.missingAltCount;
    const pct = total > 0 ? Math.round((missing / total) * 100) : 0;
    candidates.push({
      priority: 4,
      line: `${missing} image${missing !== 1 ? "s" : ""} on this page ${missing !== 1 ? "are" : "is"} invisible to screen readers and search engines. That's ${pct}% of your visual content.`,
    });
  }

  // Heading structure issues
  if (result.headings.skippedLevels.length > 0) {
    const [from, to] = result.headings.skippedLevels[0];
    candidates.push({
      priority: 5,
      line: `Screen readers can't navigate this page \u2014 your headings skip from H${from} to H${to}, breaking the document outline.`,
    });
  }

  // Placeholder / broken links
  const placeholderLinks = result.links.placeholderLinks + result.links.emptyLinks;
  if (placeholderLinks > 0) {
    candidates.push({
      priority: 6,
      line: `Visitors will hit ${placeholderLinks} dead link${placeholderLinks !== 1 ? "s" : ""} on this page. Each one is a potential customer lost.`,
    });
  }

  // Score-based fallbacks
  const score = result.overallScore;
  const topCategory = [...result.categories].sort(
    (a, b) => a.score - b.score
  )[0];

  if (score < 40) {
    candidates.push({
      priority: 7,
      line: `This ${pt} scored ${score}/100. The biggest issue: ${topCategory.name} with ${topCategory.findingsCount} problems. Here's where to start.`,
    });
  } else if (score >= 70 && score < 85) {
    const worstCat = topCategory;
    candidates.push({
      priority: 8,
      line: `Your ${pt} is solid at ${score}/100, but ${worstCat.name} is holding you back from great.`,
    });
  } else if (score >= 85) {
    const minorCount = result.allFindings.filter((f) => f.severity === "info" || f.severity === "warning").length;
    candidates.push({
      priority: 9,
      line: `Strong ${pt} at ${score}/100. ${minorCount} minor improvement${minorCount !== 1 ? "s" : ""} would get you to near-perfect.`,
    });
  } else {
    // 40-69 range
    const totalFindings = result.allFindings.length;
    candidates.push({
      priority: 10,
      line: `This ${pt} scored ${score}/100 with ${totalFindings} finding${totalFindings !== 1 ? "s" : ""}. ${topCategory.name} needs the most attention.`,
    });
  }

  return candidates;
}

function pickHookLine(result: ScanResult): string {
  const candidates = generateHookCandidates(result);
  if (candidates.length === 0) {
    return `This ${result.pageType} scored ${result.overallScore}/100 with ${result.allFindings.length} findings.`;
  }
  candidates.sort((a, b) => a.priority - b.priority);
  return candidates[0].line;
}

// ─── Quick Wins Generation ─────────────────────────────────────────

interface QuickWinTemplate {
  scanner: string;
  match: (findings: Finding[], result: ScanResult) => Finding[];
  generate: (matched: Finding[], result: ScanResult) => QuickWin;
  fixability: number; // lower = easier to fix, used for sorting
}

const QUICK_WIN_TEMPLATES: QuickWinTemplate[] = [
  {
    scanner: "meta-checker",
    match: (findings) => findings.filter((f) => f.scanner === "meta-checker" && /viewport/i.test(f.title)),
    generate: () => ({
      title: "Add viewport meta tag",
      description:
        "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to your <head>. Without it, mobile users see a tiny desktop version of your page.",
      estimatedTime: "~1 minute",
      impact: "High",
      category: "Content",
    }),
    fixability: 1,
  },
  {
    scanner: "meta-checker",
    match: (findings) => findings.filter((f) => f.scanner === "meta-checker" && /description/i.test(f.title) && !/og/i.test(f.title) && !/twitter/i.test(f.title)),
    generate: () => ({
      title: "Add a meta description",
      description:
        "Write a 150-160 character description of this page. Search engines show this in results, and it directly affects click-through rates.",
      estimatedTime: "~2 minutes",
      impact: "Medium",
      category: "Content",
    }),
    fixability: 2,
  },
  {
    scanner: "image-auditor",
    match: (findings) => findings.filter((f) => f.scanner === "image-auditor" && /alt/i.test(f.title)),
    generate: (matched, result) => {
      const count = result.images.missingAltCount;
      return {
        title: `Add alt text to ${count} image${count !== 1 ? "s" : ""}`,
        description: `${count} image${count !== 1 ? "s lack" : " lacks"} alternative text. Add descriptive alt attributes so screen readers and search engines can understand your visual content.`,
        estimatedTime: count <= 3 ? "~5 minutes" : `~${Math.round(count * 1.5)} minutes`,
        impact: "High",
        category: "Accessibility",
      };
    },
    fixability: 3,
  },
  {
    scanner: "contrast-checker",
    match: (findings) => findings.filter((f) => f.scanner === "contrast-checker"),
    generate: (matched, result) => {
      const count = result.contrast.failingCount;
      return {
        title: `Fix ${count} contrast issue${count !== 1 ? "s" : ""}`,
        description: `${count} text element${count !== 1 ? "s don't" : " doesn't"} meet WCAG AA contrast minimums. Darken the text or lighten the background to reach a 4.5:1 ratio.`,
        estimatedTime: `~${Math.max(2, count * 2)} minutes`,
        impact: "High",
        category: "Accessibility",
      };
    },
    fixability: 4,
  },
  {
    scanner: "heading-checker",
    match: (findings) => findings.filter((f) => f.scanner === "heading-checker" && /empty/i.test(f.title)),
    generate: (matched) => ({
      title: `Fix ${matched.length} empty heading${matched.length !== 1 ? "s" : ""}`,
      description:
        "Empty headings confuse screen readers and hurt your document outline. Either add text content or remove the empty heading tags.",
      estimatedTime: "~2 minutes",
      impact: "Medium",
      category: "Accessibility",
    }),
    fixability: 5,
  },
  {
    scanner: "form-analyzer",
    match: (findings) => findings.filter((f) => f.scanner === "form-analyzer" && /label/i.test(f.title)),
    generate: (matched) => {
      const count = matched.length;
      return {
        title: `Add labels to ${count} form field${count !== 1 ? "s" : ""}`,
        description: `${count} input${count !== 1 ? "s are" : " is"} missing associated labels. Add <label> elements so users know what each field is for, especially those using assistive technology.`,
        estimatedTime: `~${Math.max(5, count * 2)} minutes`,
        impact: "High",
        category: "Forms",
      };
    },
    fixability: 6,
  },
  {
    scanner: "heading-checker",
    match: (findings) => findings.filter((f) => f.scanner === "heading-checker" && /skip/i.test(f.title)),
    generate: (_matched, result) => {
      const skips = result.headings.skippedLevels;
      const desc = skips.map(([a, b]) => `H${a}\u2192H${b}`).join(", ");
      return {
        title: "Fix heading hierarchy",
        description: `Your headings skip levels (${desc}). Reorganize them into a sequential structure so screen readers can build a proper document outline.`,
        estimatedTime: "~5 minutes",
        impact: "Medium",
        category: "Accessibility",
      };
    },
    fixability: 7,
  },
  {
    scanner: "link-validator",
    match: (findings) => findings.filter((f) => f.scanner === "link-validator" && /placeholder|empty/i.test(f.title)),
    generate: (_matched, result) => {
      const count = result.links.placeholderLinks + result.links.emptyLinks;
      return {
        title: `Fix ${count} placeholder link${count !== 1 ? "s" : ""}`,
        description: `${count} link${count !== 1 ? "s go" : " goes"} nowhere (empty href, javascript:void, or # only). Replace with real URLs or remove to avoid frustrating users.`,
        estimatedTime: `~${Math.max(5, count * 2)} minutes`,
        impact: "Medium",
        category: "UX Heuristics",
      };
    },
    fixability: 8,
  },
  {
    scanner: "touch-targets",
    match: (findings) => findings.filter((f) => f.scanner === "touch-targets"),
    generate: (matched) => ({
      title: `Enlarge ${matched.length} small tap target${matched.length !== 1 ? "s" : ""}`,
      description:
        "Some interactive elements are smaller than the 44x44px minimum. Increase their size or padding so mobile users can tap them easily.",
      estimatedTime: "~10 minutes",
      impact: "Medium",
      category: "UX Heuristics",
    }),
    fixability: 9,
  },
  {
    scanner: "heading-checker",
    match: (findings) => findings.filter((f) => f.scanner === "heading-checker" && /multiple h1/i.test(f.title)),
    generate: () => ({
      title: "Use a single H1 heading",
      description:
        "Multiple H1 tags dilute your page's focus for search engines and screen readers. Keep one H1 for the main topic and use H2+ for subsections.",
      estimatedTime: "~2 minutes",
      impact: "Medium",
      category: "Accessibility",
    }),
    fixability: 5,
  },
  {
    scanner: "meta-checker",
    match: (findings) => findings.filter((f) => f.scanner === "meta-checker" && /title/i.test(f.title) && !/og/i.test(f.title) && !/twitter/i.test(f.title)),
    generate: () => ({
      title: "Improve your page title",
      description:
        "Your page title is missing or poorly formatted. Aim for 50-60 characters with your primary keyword near the front.",
      estimatedTime: "~2 minutes",
      impact: "Medium",
      category: "Content",
    }),
    fixability: 3,
  },
];

function generateQuickWins(result: ScanResult): QuickWin[] {
  const wins: Array<QuickWin & { fixability: number }> = [];

  for (const template of QUICK_WIN_TEMPLATES) {
    const matched = template.match(result.allFindings, result);
    if (matched.length > 0) {
      wins.push({
        ...template.generate(matched, result),
        fixability: template.fixability,
      });
    }
  }

  // Sort by fixability (easiest first), take top 3
  wins.sort((a, b) => a.fixability - b.fixability);
  return wins.slice(0, 3).map(({ fixability: _, ...win }) => win);
}

// ─── Page Insights Generation ──────────────────────────────────────

function generatePageInsights(result: ScanResult): string[] {
  const insights: string[] = [];
  const pt = result.pageType;

  // Page-type specific insights
  switch (pt) {
    case PageType.Landing: {
      const links = result.links.links.filter((l) => !l.isExternal && !l.isPlaceholder && !l.isProtocolLink);
      const ctaCount = links.filter((l) => {
        const text = l.text.toLowerCase();
        return /sign up|get started|try|buy|subscribe|start|join|register|learn more|cta/i.test(text);
      }).length;
      if (ctaCount > 1) {
        insights.push(
          `Landing pages with a single clear CTA convert 2-3x better. We found ${ctaCount} competing CTAs on your page.`
        );
      }
      const images = result.images.images;
      const aboveFold = images.filter((i) => i.isAboveFold).length;
      if (images.length > 0 && aboveFold === 0) {
        insights.push(
          "No images detected above the fold. Landing pages with a hero image see 40% higher engagement."
        );
      }
      break;
    }

    case PageType.Pricing: {
      const headings = result.headings.headings.map((h) => h.text.toLowerCase());
      const hasHighlighted = headings.some((h) => /recommend|popular|best|featured/i.test(h));
      insights.push(
        `Pricing pages that highlight a recommended plan see 20% higher conversion. ${hasHighlighted ? "Found" : "Did not find"} a highlighted plan.`
      );
      const crawledText = result.crawl.elements.map((e) => e.textContent.toLowerCase()).join(" ");
      const hasToggle = /annual|monthly|yearly|billing/i.test(crawledText);
      insights.push(
        `Annual/monthly toggle saves customers 15-20% on average. ${hasToggle ? "Found" : "Did not find"} a billing toggle.`
      );
      break;
    }

    case PageType.Checkout: {
      const totalFields = result.forms.forms.reduce((s, f) => s + f.fieldCount, 0)
        + result.forms.orphanedFields.length;
      if (totalFields > 0) {
        insights.push(
          `${totalFields} form field${totalFields !== 1 ? "s" : ""} on your checkout. Reducing by 1 field typically improves completion by 10%.`
        );
      }
      const crawledText = result.crawl.elements.map((e) => e.textContent.toLowerCase()).join(" ");
      const hasGuest = /guest|without account|no account/i.test(crawledText);
      insights.push(
        `Guest checkout option: ${hasGuest ? "found" : "not found"}. 24% of users abandon when forced to create an account.`
      );
      break;
    }

    case PageType.Signup:
    case PageType.Login: {
      const totalFields = result.forms.forms.reduce((s, f) => s + f.fieldCount, 0)
        + result.forms.orphanedFields.length;
      if (totalFields > 0) {
        insights.push(
          `Your ${pt.toLowerCase()} form has ${totalFields} field${totalFields !== 1 ? "s" : ""}. Best-in-class ${pt === PageType.Login ? "login" : "signup"} forms use ${pt === PageType.Login ? "2-3" : "3-5"}.`
        );
      }
      const formsWithAutocomplete = result.forms.forms.filter((f) =>
        f.fields.some((field) => field.hasAutocomplete)
      ).length;
      if (formsWithAutocomplete === 0 && result.forms.forms.length > 0) {
        insights.push(
          "No autocomplete attributes detected. Adding them lets browsers auto-fill, reducing friction by up to 30%."
        );
      }
      break;
    }

    case PageType.Blog: {
      const wordCount = result.crawl.elements
        .filter((e) => /^(p|li|blockquote|td|th)$/i.test(e.tagName))
        .reduce((sum, e) => sum + e.textContent.split(/\s+/).filter(Boolean).length, 0);
      const readingTime = Math.max(1, Math.round(wordCount / 200));
      insights.push(
        `Estimated reading time: ${readingTime} min. ${readingTime > 7 ? "Articles over 7 min benefit from a table of contents." : "Short-form content like this benefits from clear section headings."}`
      );
      const crawledText = result.crawl.elements.map((e) => e.textContent.toLowerCase()).join(" ");
      const hasSocial = /share|twitter|facebook|linkedin|x\.com/i.test(crawledText);
      if (!hasSocial) {
        insights.push(
          "No social sharing buttons detected. Shared articles drive 3-5x more traffic."
        );
      }
      break;
    }

    case PageType.Homepage: {
      const aboveFoldElements = result.crawl.elements.filter(
        (e) => e.boundingRect.y < 800 && e.isVisible
      );
      const hasValueProp = aboveFoldElements.some(
        (e) => e.tagName === "H1" || (e.tagName === "H2" && e.boundingRect.y < 400)
      );
      insights.push(
        `Your value proposition ${hasValueProp ? "is" : "isn't"} visible without scrolling. Users decide to stay or leave in 5 seconds.`
      );
      const navItems = result.links.links.filter((l) => {
        const el = result.crawl.elements.find((e) => e.selector === l.selector);
        return el && el.boundingRect.y < 100;
      }).length;
      if (navItems > 0) {
        insights.push(
          `Found ${navItems} navigation item${navItems !== 1 ? "s" : ""}. Research shows 7\u00B12 is the cognitive sweet spot.`
        );
      }
      break;
    }

    case PageType.Product: {
      const images = result.images.images;
      insights.push(
        `Found ${images.length} image${images.length !== 1 ? "s" : ""} on this product page. Top product pages use 4-8 images including lifestyle shots and zoom views.`
      );
      const crawledText = result.crawl.elements.map((e) => e.textContent.toLowerCase()).join(" ");
      const hasReviews = /review|rating|star|\u2605/i.test(crawledText);
      if (!hasReviews) {
        insights.push(
          "No customer reviews detected. Products with reviews convert 270% better than those without."
        );
      }
      break;
    }

    case PageType.Contact: {
      const totalFields = result.forms.forms.reduce((s, f) => s + f.fieldCount, 0)
        + result.forms.orphanedFields.length;
      if (totalFields > 5) {
        insights.push(
          `Your contact form has ${totalFields} fields. Contact forms with 3-5 fields get the most submissions.`
        );
      }
      break;
    }

    default:
      break;
  }

  // Universal insights based on findings
  if (result.meta.meta.lang === null) {
    insights.push(
      "No lang attribute on your <html> tag. Screen readers need this to choose the correct pronunciation rules."
    );
  }

  if (!result.meta.meta.ogTitle && !result.meta.meta.ogDescription) {
    insights.push(
      "Missing Open Graph tags. When someone shares this page on social media, it won't display a rich preview."
    );
  }

  const oversized = result.images.oversizedCount;
  if (oversized > 0) {
    insights.push(
      `${oversized} image${oversized !== 1 ? "s are" : " is"} displayed much smaller than ${oversized !== 1 ? "their" : "its"} natural size. Serving properly sized images could speed up page load.`
    );
  }

  // Return 2-3 insights
  return insights.slice(0, 3);
}

// ─── Story Cards Generation ─────────────────────────────────────────

const SCANNER_TO_CATEGORY: Record<string, string> = {
  "contrast-checker": "Accessibility",
  "heading-checker": "Accessibility",
  "image-auditor": "Accessibility",
  "form-analyzer": "Forms",
  "link-validator": "Content",
  "meta-checker": "Content",
  "touch-targets": "UX Heuristics",
  "console-capture": "Performance",
  "ux-heuristics": "UX Heuristics",
  "ux-heuristics-forms": "Forms",
  "ux-heuristics-a11y": "Accessibility",
  "ux-heuristics-content": "Content",
  "page-specific": "UX Heuristics",
};

const CATEGORY_TO_ICON: Record<string, StoryCard["iconType"]> = {
  Accessibility: "accessibility",
  "UX Heuristics": "ux",
  Forms: "forms",
  Content: "content",
  Performance: "performance",
};

interface CategoryCluster {
  name: string;
  findings: Finding[];
}

function buildCategoryClusters(result: ScanResult): CategoryCluster[] {
  const grouped: Record<string, Finding[]> = {};

  for (const finding of result.allFindings) {
    const category = SCANNER_TO_CATEGORY[finding.scanner] || finding.scanner;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(finding);
  }

  return Object.entries(grouped)
    .filter(([, findings]) => findings.length > 0)
    .map(([name, findings]) => ({ name, findings }));
}

function determineImpact(findings: Finding[]): StoryCard["impact"] {
  let hasCritical = false;
  let warningCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    if (f.severity === "critical") hasCritical = true;
    else if (f.severity === "warning") warningCount++;
    else infoCount++;
  }

  if (hasCritical) return "critical";
  if (warningCount > infoCount) return "high";
  if (warningCount > 0) return "medium";
  return "low";
}

function getTopFindingTitles(findings: Finding[], max = 3): string[] {
  const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 };
  const titleMap = new Map<string, { count: number; maxSeverity: number }>();

  for (const f of findings) {
    const existing = titleMap.get(f.title);
    const weight = severityWeight[f.severity] || 1;
    if (existing) {
      existing.count++;
      existing.maxSeverity = Math.max(existing.maxSeverity, weight);
    } else {
      titleMap.set(f.title, { count: 1, maxSeverity: weight });
    }
  }

  return Array.from(titleMap.entries())
    .sort((a, b) => {
      const sevDiff = b[1].maxSeverity - a[1].maxSeverity;
      if (sevDiff !== 0) return sevDiff;
      return b[1].count - a[1].count;
    })
    .slice(0, max)
    .map(([title]) => title);
}

function generateHeadline(category: string, findings: Finding[], result: ScanResult): string {
  const count = findings.length;

  switch (category) {
    case "Accessibility": {
      const missingAlt = result.images.missingAltCount;
      const contrastFails = result.contrast.failingCount;
      if (missingAlt > 0 && contrastFails > 0) {
        return "Screen readers and low-vision users can't fully use your site";
      }
      if (missingAlt > 0) {
        return `${missingAlt} image${missingAlt !== 1 ? "s are" : " is"} invisible to screen readers`;
      }
      if (contrastFails > 0) {
        return "Text contrast is too low for many of your visitors";
      }
      if (result.headings.skippedLevels.length > 0) {
        return "Screen readers can't navigate your page structure";
      }
      return `Your site has ${count} accessibility gap${count !== 1 ? "s" : ""} that affect visitors`;
    }

    case "Forms": {
      const totalFields = result.forms.forms.reduce((s, f) => s + f.fieldCount, 0)
        + result.forms.orphanedFields.length;
      if (totalFields > 5) {
        return `Your forms are creating friction with ${totalFields} fields`;
      }
      const missingLabels = findings.filter((f) => /label/i.test(f.title)).length;
      if (missingLabels > 0) {
        return `${missingLabels} form field${missingLabels !== 1 ? "s" : ""} ${missingLabels !== 1 ? "are" : "is"} missing labels`;
      }
      return "Your forms have barriers that reduce completions";
    }

    case "Content": {
      const missingMeta = findings.filter((f) => f.scanner === "meta-checker").length;
      const brokenLinks = findings.filter((f) => f.scanner === "link-validator").length;
      if (missingMeta > 0 && brokenLinks > 0) {
        return "Search engines can't fully understand your site";
      }
      if (brokenLinks > 0) {
        return `Visitors will hit ${brokenLinks} dead link${brokenLinks !== 1 ? "s" : ""} on this page`;
      }
      return "Your SEO foundation needs work";
    }

    case "UX Heuristics": {
      const touchIssues = findings.filter((f) => f.scanner === "touch-targets").length;
      if (touchIssues > 0) {
        return `${touchIssues} tap target${touchIssues !== 1 ? "s are" : " is"} too small for mobile users`;
      }
      return "Users may struggle to navigate your interface";
    }

    case "Performance": {
      const consoleErrors = findings.filter((f) => f.scanner === "console-capture").length;
      if (consoleErrors > 0) {
        return `${consoleErrors} JavaScript error${consoleErrors !== 1 ? "s" : ""} may be breaking functionality`;
      }
      return "Page performance is being impacted";
    }

    default:
      return `${count} issue${count !== 1 ? "s" : ""} found in ${category}`;
  }
}

function generateNarrative(category: string, findings: Finding[], result: ScanResult): string {
  const count = findings.length;

  switch (category) {
    case "Accessibility": {
      const parts: string[] = [];
      const missingAlt = result.images.missingAltCount;
      const contrastFails = result.contrast.failingCount;
      const skippedLevels = result.headings.skippedLevels;

      if (missingAlt > 0) {
        parts.push(`${missingAlt} image${missingAlt !== 1 ? "s have" : " has"} no alt text`);
      }
      if (contrastFails > 0) {
        parts.push(`${contrastFails} text element${contrastFails !== 1 ? "s fail" : " fails"} contrast standards`);
      }
      if (skippedLevels.length > 0) {
        parts.push("the heading hierarchy has gaps");
      }

      const detail = parts.length > 0 ? parts.join(", ") + ". " : "";
      return `${detail}These ${count} issue${count !== 1 ? "s" : ""} affect an estimated 15% of visitors using assistive technology, and may expose you to legal compliance risks.`;
    }

    case "Forms": {
      const totalFields = result.forms.forms.reduce((s, f) => s + f.fieldCount, 0)
        + result.forms.orphanedFields.length;
      const missingLabels = findings.filter((f) => /label/i.test(f.title)).length;
      const parts: string[] = [];

      if (totalFields > 5) {
        parts.push(`Your form asks for ${totalFields} fields, which is above the recommended maximum`);
      }
      if (missingLabels > 0) {
        parts.push(`${missingLabels} field${missingLabels !== 1 ? "s are" : " is"} missing proper labels`);
      }

      const detail = parts.length > 0 ? parts.join(", and ") + ". " : "";
      return `${detail}Each additional form barrier typically reduces completion rates by 5-10%. Simplifying your forms could have a direct impact on conversions.`;
    }

    case "Content": {
      const metaIssues = findings.filter((f) => f.scanner === "meta-checker").length;
      const linkIssues = findings.filter((f) => f.scanner === "link-validator").length;
      const parts: string[] = [];

      if (metaIssues > 0) {
        parts.push(`${metaIssues} missing or incomplete meta tag${metaIssues !== 1 ? "s" : ""}`);
      }
      if (linkIssues > 0) {
        parts.push(`${linkIssues} broken or placeholder link${linkIssues !== 1 ? "s" : ""}`);
      }

      const detail = parts.length > 0 ? "Found " + parts.join(" and ") + ". " : "";
      return `${detail}These issues limit how search engines index your page and can frustrate visitors who encounter dead ends.`;
    }

    case "UX Heuristics": {
      const touchIssues = findings.filter((f) => f.scanner === "touch-targets").length;
      if (touchIssues > 0) {
        return `${touchIssues} interactive element${touchIssues !== 1 ? "s are" : " is"} smaller than the recommended 44x44px minimum. On mobile, this makes your site harder to use and can lead to accidental taps on the wrong element.`;
      }
      return `Found ${count} usability issue${count !== 1 ? "s" : ""} that could make your interface harder to navigate. Addressing these will improve the experience for all visitors.`;
    }

    case "Performance": {
      const consoleErrors = findings.filter((f) => f.scanner === "console-capture").length;
      if (consoleErrors > 0) {
        return `Your page is producing ${consoleErrors} JavaScript error${consoleErrors !== 1 ? "s" : ""}. These can break interactive features, cause visible glitches, and degrade the experience for your visitors.`;
      }
      return `Found ${count} performance-related issue${count !== 1 ? "s" : ""} that may slow down your page or affect reliability. Faster pages have higher conversion rates and better search rankings.`;
    }

    default:
      return `Found ${count} issue${count !== 1 ? "s" : ""} in this category. Addressing these will improve the overall quality of your page.`;
  }
}

function generateStoryCards(result: ScanResult): StoryCard[] {
  const clusters = buildCategoryClusters(result);

  const cards: StoryCard[] = clusters.map((cluster, index) => ({
    id: `story-${index}-${cluster.name.toLowerCase().replace(/\s+/g, "-")}`,
    headline: generateHeadline(cluster.name, cluster.findings, result),
    narrative: generateNarrative(cluster.name, cluster.findings, result),
    impact: determineImpact(cluster.findings),
    category: cluster.name,
    findingCount: cluster.findings.length,
    topFindings: getTopFindingTitles(cluster.findings),
    iconType: CATEGORY_TO_ICON[cluster.name] || "security",
  }));

  // Sort by impact (critical first), then by finding count
  const impactOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  cards.sort((a, b) => {
    const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
    if (impactDiff !== 0) return impactDiff;
    return b.findingCount - a.findingCount;
  });

  // Return maximum 6 cards
  return cards.slice(0, 6);
}

// ─── Main Export ────────────────────────────────────────────────────

export function generateAnalysis(result: ScanResult): AIAnalysis {
  return {
    hookLine: pickHookLine(result),
    quickWins: generateQuickWins(result),
    pageInsights: generatePageInsights(result),
    storyCards: generateStoryCards(result),
  };
}
