import type { Finding } from "@placeholder/shared";

export interface HumanizedFinding {
  humanDescription: string;
  whyItMatters: string;
}

/**
 * Pattern-match rule: a case-insensitive test on title and/or scanner,
 * returning humanized description and impact context.
 */
interface HumanizeRule {
  test: (finding: Finding) => boolean;
  humanize: (finding: Finding) => HumanizedFinding;
}

// ── Helpers ────────────────────────────────────────────────────────────

function titleContains(finding: Finding, ...keywords: string[]): boolean {
  const t = finding.title.toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

function descContains(finding: Finding, ...keywords: string[]): boolean {
  const d = finding.description.toLowerCase();
  return keywords.some((k) => d.includes(k.toLowerCase()));
}

function isScanner(finding: Finding, scanner: string): boolean {
  return finding.scanner === scanner;
}

/**
 * Try to extract the contrast ratio and required ratio from a contrast-checker
 * finding description like '... contrast ratio of 2.5:1 ... requires at least 4.5:1 ...'
 */
function extractContrastNumbers(desc: string): { actual: string; required: string } {
  const actualMatch = desc.match(/ratio of ([\d.]+):1/);
  const requiredMatch = desc.match(/at least ([\d.]+):1/);
  return {
    actual: actualMatch?.[1] ?? "?",
    required: requiredMatch?.[1] ?? "4.5",
  };
}

/**
 * Try to extract heading levels from a skipped-heading title like
 * "Heading level skipped: H2 to H5"
 */
function extractHeadingLevels(title: string): { from: string; to: string } {
  const match = title.match(/H(\d)\s+to\s+H(\d)/i);
  return {
    from: match?.[1] ?? "?",
    to: match?.[2] ?? "?",
  };
}

// ── Rules ──────────────────────────────────────────────────────────────

const rules: HumanizeRule[] = [
  // ─── Contrast Checker ──────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "contrast-checker") &&
      (titleContains(f, "contrast") || titleContains(f, "color contrast")),
    humanize: (f) => {
      const { actual, required } = extractContrastNumbers(f.description);
      return {
        humanDescription: `The text in this area is hard to read because the color doesn't stand out enough from the background. The contrast ratio is ${actual}:1 but needs to be at least ${required}:1.`,
        whyItMatters:
          "Low contrast text is difficult to read for people with vision impairments, older users, and anyone viewing in bright sunlight. This affects roughly 1 in 12 men and 1 in 200 women.",
      };
    },
  },

  // ─── Heading Checker ───────────────────────────────────────────────
  {
    test: (f) => isScanner(f, "heading-checker") && titleContains(f, "no h1", "missing h1"),
    humanize: () => ({
      humanDescription:
        "Your page doesn't have a main heading (H1). This is like a book chapter without a title.",
      whyItMatters:
        "Search engines use H1 to understand what your page is about. Missing it can hurt your search ranking.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "heading-checker") &&
      titleContains(f, "skipped", "heading level skipped"),
    humanize: (f) => {
      const { from, to } = extractHeadingLevels(f.title);
      return {
        humanDescription: `Your headings jump from H${from} to H${to}, skipping a level. Think of it like a book going from Chapter ${from} to Chapter ${to}.`,
        whyItMatters:
          "Screen readers use headings to navigate your page. Skipped levels make navigation confusing for visually impaired users.",
      };
    },
  },
  {
    test: (f) =>
      isScanner(f, "heading-checker") && titleContains(f, "multiple h1", "h1 headings"),
    humanize: () => ({
      humanDescription: "Your page has more than one main heading (H1).",
      whyItMatters:
        "Multiple H1s can confuse search engines about what your page's main topic is.",
    }),
  },
  {
    test: (f) => isScanner(f, "heading-checker") && titleContains(f, "empty"),
    humanize: () => ({
      humanDescription: "There's a heading tag that contains no text.",
      whyItMatters:
        "Empty headings create confusing gaps for screen reader users navigating by headings.",
    }),
  },

  // ─── Image Auditor ─────────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "image-auditor") &&
      titleContains(f, "linked image", "image inside link"),
    humanize: () => ({
      humanDescription:
        "An image inside a clickable link has no description. Screen reader users won't know where the link goes.",
      whyItMatters:
        "This is a critical accessibility failure. The link is essentially invisible to screen reader users.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "image-auditor") &&
      (titleContains(f, "missing alt") || titleContains(f, "image missing alt")),
    humanize: () => ({
      humanDescription:
        "This image has no description for screen readers. When a visually impaired user encounters it, they'll hear 'image' with no context.",
      whyItMatters:
        "Missing alt text is the #1 accessibility violation found in lawsuits. It also hurts your SEO since Google can't understand what the image shows.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "image-auditor") &&
      titleContains(f, "oversized", "image optimization"),
    humanize: () => ({
      humanDescription:
        "This image is much larger than what's displayed on screen, wasting bandwidth and slowing your page.",
      whyItMatters:
        "Slow-loading images increase bounce rates. Users on mobile or slow connections may leave before the page finishes loading.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "image-auditor") && titleContains(f, "lazy loading", "lazy"),
    humanize: () => ({
      humanDescription:
        "Images are loading all at once instead of as the user scrolls. This means visitors wait for images they haven't even scrolled to yet.",
      whyItMatters:
        "Lazy loading can reduce initial page load time by 30-50%, directly improving the experience for every visitor.",
    }),
  },

  // ─── Link Validator ────────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "link-validator") && titleContains(f, "empty href", "no href"),
    humanize: () => ({
      humanDescription: "A link on your page doesn't actually go anywhere.",
      whyItMatters:
        "Broken or empty links frustrate users and signal low quality to search engines.",
    }),
  },
  {
    test: (f) => isScanner(f, "link-validator") && titleContains(f, "javascript:"),
    humanize: () => ({
      humanDescription:
        "A link uses JavaScript instead of a real URL. This breaks browser features like open-in-new-tab and bookmarking.",
      whyItMatters:
        "This is considered a bad practice that degrades the user experience and hurts accessibility.",
    }),
  },
  {
    test: (f) => isScanner(f, "link-validator") && titleContains(f, "broken anchor"),
    humanize: () => ({
      humanDescription: "A link points to a section of the page that doesn't exist.",
      whyItMatters:
        "Clicking this link does nothing, which confuses users who expected to be taken somewhere.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "link-validator") &&
      titleContains(f, "generic", "not descriptive"),
    humanize: () => ({
      humanDescription:
        "A link uses vague text like 'click here' or 'read more' instead of describing where it goes.",
      whyItMatters:
        "Descriptive link text helps both screen reader users and SEO. 'View pricing plans' is much better than 'click here.'",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "link-validator") &&
      titleContains(f, "target=_blank", "new window"),
    humanize: () => ({
      humanDescription: "A link opens in a new tab without warning the user.",
      whyItMatters:
        "Unexpected new tabs disorient users, especially those using screen readers or with cognitive disabilities.",
    }),
  },

  // ─── Meta Checker ──────────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "meta-checker") &&
      titleContains(f, "no <title>", "missing title"),
    humanize: () => ({
      humanDescription:
        "Your page has no title tag. This is what shows in browser tabs and search results.",
      whyItMatters:
        "Without a title, search engines don't know what to display for your page, and users can't tell your tab apart from others.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") &&
      (titleContains(f, "title is very short") || titleContains(f, "title may be truncated")),
    humanize: (f) => {
      const isShort = f.title.toLowerCase().includes("short");
      return {
        humanDescription: `Your page title is ${isShort ? "too short" : "too long"} for optimal search display.`,
        whyItMatters:
          "Titles between 50-60 characters display best in Google search results. Outside that range, your title gets truncated or looks thin.",
      };
    },
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") && titleContains(f, "missing meta description"),
    humanize: () => ({
      humanDescription:
        "Your page has no meta description. This is the preview text shown in search results.",
      whyItMatters:
        "A good meta description can significantly increase click-through rates from search results. Without one, Google generates its own -- often poorly.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") && titleContains(f, "missing viewport", "viewport meta"),
    humanize: () => ({
      humanDescription:
        "Your page doesn't have a viewport meta tag, which tells mobile browsers how to scale the page.",
      whyItMatters:
        "Without this, your site will look zoomed out and tiny on mobile devices, making it unusable on phones.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") &&
      (titleContains(f, "open graph") || titleContains(f, "og:")),
    humanize: () => ({
      humanDescription:
        "Your page is missing social media preview tags. When someone shares your URL on social media, it won't show a proper preview.",
      whyItMatters:
        "Posts with rich previews (image, title, description) get significantly more clicks than plain URL posts.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") && titleContains(f, "favicon"),
    humanize: () => ({
      humanDescription:
        "Your site has no favicon (the small icon in browser tabs).",
      whyItMatters:
        "Missing favicons make your site look unprofessional and make it harder for users to find your tab among many open tabs.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") &&
      (titleContains(f, "noindex") || titleContains(f, "robots")),
    humanize: () => ({
      humanDescription:
        "Your page is telling search engines NOT to index it.",
      whyItMatters:
        "If this is intentional (staging site, private page), ignore this. If not, your page is invisible to Google.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "meta-checker") && titleContains(f, "canonical"),
    humanize: () => ({
      humanDescription: "Your canonical URL may have an issue.",
      whyItMatters:
        "Canonical tags tell search engines which version of a page is the 'real' one. Incorrect canonicals can cause your page to disappear from search results.",
    }),
  },

  // ─── Form Analyzer ─────────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "form-analyzer") && titleContains(f, "missing label", "nolabel"),
    humanize: () => ({
      humanDescription: "A form field has no label telling users what to type.",
      whyItMatters:
        "Unlabeled fields are confusing for all users and completely inaccessible to screen reader users. They also prevent browsers from auto-filling correctly.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "form-analyzer") && titleContains(f, "no submit button", "nosubmit"),
    humanize: () => ({
      humanDescription: "This form has no visible submit button.",
      whyItMatters:
        "Users may not realize how to complete the form. Not everyone knows they can press Enter to submit.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "form-analyzer") && titleContains(f, "autocomplete"),
    humanize: () => ({
      humanDescription:
        "Form fields are missing autocomplete attributes, which help browsers auto-fill user information.",
      whyItMatters:
        "Auto-fill reduces form completion time by up to 30%. Without it, users type everything manually, increasing abandonment.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "form-analyzer") &&
      (titleContains(f, "fieldset") ||
        titleContains(f, "radio") ||
        titleContains(f, "checkbox")),
    humanize: () => ({
      humanDescription:
        "Related form options (like radio buttons) aren't grouped together with a label.",
      whyItMatters:
        "Screen reader users won't understand which options belong together or what the group is asking.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "form-analyzer") && titleContains(f, "password toggle", "password"),
    humanize: () => ({
      humanDescription: "Password fields don't have a show/hide toggle.",
      whyItMatters:
        "Users frequently mistype passwords. A toggle reduces failed login attempts and frustration.",
    }),
  },

  // ─── Touch Targets ─────────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "touch-targets") &&
      (titleContains(f, "too small") || titleContains(f, "small touch target")),
    humanize: (f) => {
      const sizeMatch = f.title.match(/\((.+?)\)/);
      const size = sizeMatch?.[1] ?? "too small";
      return {
        humanDescription: `This interactive element is too small to tap reliably on a touchscreen. It's ${size} but should be at least 44x44px.`,
        whyItMatters:
          "Small tap targets cause 'fat finger' errors on mobile. Users tap the wrong thing, get frustrated, and leave.",
      };
    },
  },
  {
    test: (f) =>
      isScanner(f, "touch-targets") &&
      (titleContains(f, "spacing") || titleContains(f, "too close")),
    humanize: () => ({
      humanDescription:
        "Interactive elements are too close together, making it easy to accidentally tap the wrong one.",
      whyItMatters:
        "When buttons or links are packed tight, mobile users will constantly hit the wrong target.",
    }),
  },

  // ─── Console Capture ───────────────────────────────────────────────
  {
    test: (f) =>
      isScanner(f, "console-capture") &&
      (titleContains(f, "javascript error") || titleContains(f, "runtime error")),
    humanize: () => ({
      humanDescription:
        "Your page has JavaScript errors running in the background.",
      whyItMatters:
        "JavaScript errors can cause buttons to stop working, forms to break, or content to not load. Users may see a broken experience without knowing why.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "console-capture") && titleContains(f, "csp violation"),
    humanize: () => ({
      humanDescription:
        "A security policy on your page is blocking some content from loading.",
      whyItMatters:
        "This might mean images, scripts, or fonts aren't loading correctly, which could break parts of your site.",
    }),
  },
  {
    test: (f) =>
      isScanner(f, "console-capture") && titleContains(f, "promise rejection"),
    humanize: () => ({
      humanDescription: "An operation on your page failed silently.",
      whyItMatters:
        "These silent failures often mean data isn't loading, features aren't working, or API calls are failing -- but users just see a blank or broken page.",
    }),
  },
];

// ── Main export ────────────────────────────────────────────────────────

const DEFAULT_WHY = "This issue may affect your site's usability, accessibility, or search ranking.";

export function humanizeFinding(finding: Finding): HumanizedFinding {
  for (const rule of rules) {
    if (rule.test(finding)) {
      return rule.humanize(finding);
    }
  }

  return {
    humanDescription: finding.description,
    whyItMatters: DEFAULT_WHY,
  };
}
