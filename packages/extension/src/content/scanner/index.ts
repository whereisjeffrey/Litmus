import type {
  ScanResult,
  Finding,
  CategoryScore,
  CrawlResult,
  LinkResult,
  FormResult,
  ContrastResult,
  HeadingResult,
  ImageResult,
  MetaResult,
  TouchTargetResult,
  ConsoleResult,
} from "@placeholder/shared";
import { PageType, SCORE_WEIGHTS } from "@placeholder/shared";

import { crawlDOM } from "./dom-crawler";
import { validateLinks } from "./link-validator";
import { analyzeForms } from "./form-analyzer";
import { checkContrast } from "./contrast-checker";
import { checkHeadings } from "./heading-checker";
import { auditImages } from "./image-auditor";
import { checkMeta } from "./meta-checker";
import { checkTouchTargets } from "./touch-targets";
import { collectConsoleErrors } from "./console-capture";
import { checkUXHeuristics } from "./ux-heuristics";
import { runPageSpecificChecks } from "./page-specific-checks";
import { detectPageType } from "./page-type-detector";
import { generateAnalysis } from "./ai-analyzer";

type ProgressCallback = (message: string, percent: number) => void;

/** Maximum total scan time in ms */
const TOTAL_SCAN_TIMEOUT_MS = 15000;

/**
 * Generates a unique ID for a finding using scanner name and a hash.
 */
let findingCounter = 0;
function ensureUniqueId(finding: Finding): Finding {
  findingCounter++;
  return {
    ...finding,
    id: `${finding.scanner}-${findingCounter}-${finding.id}`,
  };
}

/**
 * Wraps a scanner function call with error handling so one failing scanner
 * doesn't crash the entire scan.
 */
function safeRun<T>(
  name: string,
  fn: () => T,
  fallback: T
): T {
  try {
    return fn();
  } catch (err) {
    console.warn(`[Placeholder] Scanner "${name}" failed:`, err);
    return fallback;
  }
}

/**
 * Maps scanner names to scoring categories and weights.
 * Computes a 0-100 score for each category based on severity-weighted deductions.
 */
function computeCategories(allFindings: Finding[]): CategoryScore[] {
  const categoryMap: Record<string, { scanners: string[]; weight: number }> = {
    Accessibility: {
      scanners: ["contrast-checker", "heading-checker", "image-auditor", "ux-heuristics-a11y"],
      weight: SCORE_WEIGHTS.accessibility,
    },
    "UX Heuristics": {
      scanners: ["link-validator", "touch-targets", "ux-heuristics", "page-specific"],
      weight: SCORE_WEIGHTS.uxHeuristics,
    },
    Forms: {
      scanners: ["form-analyzer", "page-specific", "ux-heuristics-forms"],
      weight: SCORE_WEIGHTS.forms,
    },
    Content: {
      scanners: ["meta-checker", "page-specific", "ux-heuristics-content"],
      weight: SCORE_WEIGHTS.content,
    },
    "Visual Consistency": {
      scanners: ["image-auditor"],
      weight: SCORE_WEIGHTS.visualConsistency,
    },
    "Performance UX": {
      scanners: ["console-capture"],
      weight: SCORE_WEIGHTS.performanceUx,
    },
  };

  return Object.entries(categoryMap).map(([name, { scanners, weight }]) => {
    const relevant = allFindings.filter((f) => scanners.includes(f.scanner));
    let deductions = 0;
    for (const f of relevant) {
      switch (f.severity) {
        case "critical":
          deductions += 15;
          break;
        case "warning":
          deductions += 7;
          break;
        case "info":
          deductions += 2;
          break;
      }
    }
    // Cap deductions so a category can't go below 0
    const score = Math.max(0, Math.min(100, 100 - deductions));
    return { name, score, weight, findingsCount: relevant.length };
  });
}

/**
 * Creates empty/default results for when a scanner fails.
 */
const EMPTY_CRAWL: CrawlResult = {
  url: window.location.href,
  title: document.title,
  elements: [],
  totalElements: 0,
  timestamp: Date.now(),
};

const EMPTY_LINKS: LinkResult = {
  links: [],
  totalLinks: 0,
  placeholderLinks: 0,
  emptyLinks: 0,
  findings: [],
};

const EMPTY_FORMS: FormResult = {
  forms: [],
  orphanedFields: [],
  findings: [],
};

const EMPTY_CONTRAST: ContrastResult = {
  pairs: [],
  passingCount: 0,
  failingCount: 0,
  findings: [],
};

const EMPTY_HEADINGS: HeadingResult = {
  headings: [],
  hasH1: false,
  multipleH1s: false,
  skippedLevels: [],
  findings: [],
};

const EMPTY_IMAGES: ImageResult = {
  images: [],
  missingAltCount: 0,
  oversizedCount: 0,
  findings: [],
};

const EMPTY_META: MetaResult = {
  meta: {
    title: null,
    titleLength: 0,
    description: null,
    descriptionLength: 0,
    hasViewport: false,
    viewportContent: null,
    hasCharset: false,
    ogTitle: null,
    ogDescription: null,
    ogImage: null,
    ogUrl: null,
    twitterCard: null,
    twitterTitle: null,
    twitterDescription: null,
    twitterImage: null,
    canonicalUrl: null,
    favicon: null,
    lang: null,
    robots: null,
  },
  findings: [],
};

const EMPTY_TOUCH: TouchTargetResult = {
  targets: [],
  failingCount: 0,
  findings: [],
};

const EMPTY_CONSOLE: ConsoleResult = {
  errors: [],
  findings: [],
};

/**
 * Runs all scanners in sequence with progress callbacks and returns
 * a complete ScanResult. Individual scanner failures are caught and
 * don't crash the entire scan. A total timeout of 15 seconds is enforced.
 */
export async function runFullScan(
  onProgress: ProgressCallback
): Promise<ScanResult> {
  findingCounter = 0;
  const scanStart = Date.now();

  const isTimedOut = () => Date.now() - scanStart > TOTAL_SCAN_TIMEOUT_MS;

  // Detect page type early — before crawling — so results can be contextualised
  const pageType: PageType = safeRun("page-type-detector", detectPageType, PageType.Unknown);
  onProgress(`Detected: ${pageType}`, 3);

  onProgress("Reading your page...", 5);
  const crawl: CrawlResult = safeRun("dom-crawler", crawlDOM, EMPTY_CRAWL);

  if (isTimedOut()) {
    return buildResult(crawl, EMPTY_LINKS, EMPTY_CONTRAST, EMPTY_HEADINGS, EMPTY_FORMS, EMPTY_IMAGES, EMPTY_META, EMPTY_TOUCH, EMPTY_CONSOLE, [], [], pageType);
  }

  onProgress("Checking links...", 15);
  const links: LinkResult = safeRun("link-validator", validateLinks, EMPTY_LINKS);

  onProgress("Checking accessibility...", 30);
  const contrast: ContrastResult = safeRun("contrast-checker", checkContrast, EMPTY_CONTRAST);
  const headings: HeadingResult = safeRun("heading-checker", checkHeadings, EMPTY_HEADINGS);

  if (isTimedOut()) {
    return buildResult(crawl, links, contrast, headings, EMPTY_FORMS, EMPTY_IMAGES, EMPTY_META, EMPTY_TOUCH, EMPTY_CONSOLE, [], [], pageType);
  }

  onProgress("Analyzing forms & inputs...", 50);
  const forms: FormResult = safeRun("form-analyzer", analyzeForms, EMPTY_FORMS);

  onProgress("Reviewing images & media...", 65);
  const images: ImageResult = safeRun("image-auditor", auditImages, EMPTY_IMAGES);

  if (isTimedOut()) {
    return buildResult(crawl, links, contrast, headings, forms, images, EMPTY_META, EMPTY_TOUCH, EMPTY_CONSOLE, [], [], pageType);
  }

  onProgress("Evaluating user experience...", 75);
  const meta: MetaResult = safeRun("meta-checker", checkMeta, EMPTY_META);
  const touchTargets: TouchTargetResult = safeRun("touch-targets", checkTouchTargets, EMPTY_TOUCH);

  onProgress("Checking for errors...", 80);
  const consoleResult: ConsoleResult = safeRun("console-capture", collectConsoleErrors, EMPTY_CONSOLE);

  onProgress("Checking UX heuristics...", 85);
  const uxHeuristics = safeRun("ux-heuristics", checkUXHeuristics, { findings: [] as Finding[] });

  onProgress("Running page-specific checks...", 90);
  const pageSpecific = safeRun("page-specific", () => runPageSpecificChecks(pageType), { findings: [] as Finding[] });

  onProgress("Crunching the numbers...", 95);

  return buildResult(crawl, links, contrast, headings, forms, images, meta, touchTargets, consoleResult, uxHeuristics.findings, pageSpecific.findings, pageType);
}

/**
 * Assembles the final ScanResult from all scanner outputs.
 */
function buildResult(
  crawl: CrawlResult,
  links: LinkResult,
  contrast: ContrastResult,
  headings: HeadingResult,
  forms: FormResult,
  images: ImageResult,
  meta: MetaResult,
  touchTargets: TouchTargetResult,
  consoleResult: ConsoleResult,
  uxHeuristicFindings: Finding[] = [],
  pageSpecificFindings: Finding[] = [],
  pageType: PageType = PageType.Unknown
): ScanResult {
  // Merge all findings and assign unique IDs
  const allFindings: Finding[] = [
    ...links.findings,
    ...forms.findings,
    ...contrast.findings,
    ...headings.findings,
    ...images.findings,
    ...meta.findings,
    ...touchTargets.findings,
    ...consoleResult.findings,
    ...uxHeuristicFindings,
    ...pageSpecificFindings,
  ].map(ensureUniqueId);

  // Sort: critical first, then warning, then info
  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  allFindings.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const categories = computeCategories(allFindings);

  // Weighted overall score
  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );

  const partial: ScanResult = {
    url: crawl.url,
    timestamp: Date.now(),
    overallScore,
    pageType,
    categories,
    crawl,
    links,
    forms,
    contrast,
    headings,
    images,
    meta,
    touchTargets,
    console: consoleResult,
    allFindings,
  };

  partial.aiAnalysis = generateAnalysis(partial);

  return partial;
}
