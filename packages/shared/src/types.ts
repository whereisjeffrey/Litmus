// ─── Severity & State ───────────────────────────────────────────────

export type FindingSeverity = "critical" | "warning" | "info";

export type ScanState = "idle" | "scanning" | "complete" | "error";

export enum PageType {
  Landing = "Landing Page",
  Pricing = "Pricing Page",
  Checkout = "Checkout",
  Signup = "Signup / Register",
  Login = "Login",
  Dashboard = "Dashboard / App",
  Blog = "Blog / Article",
  Product = "Product Page",
  Contact = "Contact / Support",
  Documentation = "Documentation",
  Settings = "Settings",
  Onboarding = "Onboarding",
  Homepage = "Homepage",
  About = "About Page",
  Unknown = "Web Page",
}

// ─── Findings ───────────────────────────────────────────────────────

export interface Finding {
  id: string;
  scanner: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  /** CSS selector path to the offending element */
  selector: string | null;
  /** WCAG or heuristic reference (e.g. "WCAG 1.4.3") */
  standard: string | null;
}

// ─── DOM Crawler ────────────────────────────────────────────────────

export interface CrawledElement {
  tagName: string;
  textContent: string;
  attributes: Record<string, string>;
  computedStyles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    display: string;
    visibility: string;
    opacity: string;
  };
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  childrenCount: number;
  selector: string;
  isVisible: boolean;
  inShadowDOM: boolean;
  iframeOrigin: string | null;
}

export interface CrawlResult {
  url: string;
  title: string;
  elements: CrawledElement[];
  totalElements: number;
  timestamp: number;
}

// ─── Link Validator ─────────────────────────────────────────────────

export interface LinkInfo {
  href: string;
  text: string;
  selector: string;
  isExternal: boolean;
  /** null until checked server-side in Phase 2 */
  statusCode: number | null;
  isBroken: boolean | null;
  /** Links with empty href, javascript:void, or # only */
  isPlaceholder: boolean;
  /** mailto:, tel:, etc. */
  isProtocolLink: boolean;
  /** Anchor link pointing to a non-existent ID on the page */
  isBrokenAnchor: boolean;
}

export interface LinkResult {
  links: LinkInfo[];
  totalLinks: number;
  placeholderLinks: number;
  emptyLinks: number;
  findings: Finding[];
}

// ─── Form Analyzer ──────────────────────────────────────────────────

export interface FormFieldInfo {
  type: string;
  name: string;
  id: string;
  selector: string;
  hasLabel: boolean;
  hasPlaceholder: boolean;
  hasAutocomplete: boolean;
  autocompleteValue: string;
  isRequired: boolean;
  hasAriaLabel: boolean;
  hasAriaDescribedBy: boolean;
  hasVisibleRequiredIndicator: boolean;
  hasPasswordToggle: boolean;
}

export interface FormInfo {
  action: string;
  method: string;
  selector: string;
  fields: FormFieldInfo[];
  fieldCount: number;
  hasSubmitButton: boolean;
  hasFieldset: boolean;
}

export interface FormResult {
  forms: FormInfo[];
  orphanedFields: FormFieldInfo[];
  findings: Finding[];
}

// ─── Contrast Checker ───────────────────────────────────────────────

export interface ContrastPair {
  selector: string;
  textColor: string;
  backgroundColor: string;
  contrastRatio: number;
  fontSize: number;
  fontWeight: number;
  isLargeText: boolean;
  requiredRatio: number;
  passes: boolean;
  textSnippet: string;
  /** True when background has gradient/image and contrast cannot be determined precisely */
  hasComplexBackground: boolean;
}

export interface ContrastResult {
  pairs: ContrastPair[];
  passingCount: number;
  failingCount: number;
  findings: Finding[];
}

// ─── Heading Checker ────────────────────────────────────────────────

export interface HeadingInfo {
  level: number;
  text: string;
  selector: string;
  isHidden: boolean;
  isAriaHidden: boolean;
}

export interface HeadingResult {
  headings: HeadingInfo[];
  hasH1: boolean;
  multipleH1s: boolean;
  skippedLevels: [number, number][];
  findings: Finding[];
}

// ─── Image Auditor ──────────────────────────────────────────────────

export interface ImageInfo {
  src: string;
  alt: string;
  selector: string;
  hasAlt: boolean;
  altIsFilename: boolean;
  altIsRedundant: boolean;
  naturalWidth: number;
  naturalHeight: number;
  displayWidth: number;
  displayHeight: number;
  isOversized: boolean;
  hasLazyLoading: boolean;
  isAboveFold: boolean;
  isLinkedImage: boolean;
  isSvg: boolean;
  hasSrcset: boolean;
}

export interface ImageResult {
  images: ImageInfo[];
  missingAltCount: number;
  oversizedCount: number;
  findings: Finding[];
}

// ─── Meta Checker ───────────────────────────────────────────────────

export interface MetaInfo {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  hasViewport: boolean;
  viewportContent: string | null;
  hasCharset: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  canonicalUrl: string | null;
  favicon: string | null;
  lang: string | null;
  robots: string | null;
}

export interface MetaResult {
  meta: MetaInfo;
  findings: Finding[];
}

// ─── Touch Targets ──────────────────────────────────────────────────

export interface TouchTargetInfo {
  selector: string;
  tagName: string;
  text: string;
  width: number;
  height: number;
  meetsMinimum: boolean;
  /** Distance in px to the nearest other interactive element */
  spacingToNearest: number | null;
  hasSufficientSpacing: boolean;
}

export interface TouchTargetResult {
  targets: TouchTargetInfo[];
  failingCount: number;
  findings: Finding[];
}

// ─── Console Capture ────────────────────────────────────────────────

export interface ConsoleError {
  message: string;
  source: string | null;
  line: number | null;
  column: number | null;
  timestamp: number;
  type: "error" | "unhandledrejection" | "csp-violation";
}

export interface ConsoleResult {
  errors: ConsoleError[];
  findings: Finding[];
}

// ─── Story Cards ────────────────────────────────────────────────────

export interface StoryCard {
  id: string;
  headline: string;
  narrative: string;
  impact: "critical" | "high" | "medium" | "low";
  category: string;
  findingCount: number;
  topFindings: string[];
  iconType: "accessibility" | "ux" | "forms" | "content" | "performance" | "security";
}

// ─── AI Analysis ───────────────────────────────────────────────────

export interface QuickWin {
  title: string;
  description: string;
  estimatedTime: string;
  impact: string;
  category: string;
}

export interface AIAnalysis {
  hookLine: string;
  quickWins: QuickWin[];
  pageInsights: string[];
  storyCards?: StoryCard[];
}

// ─── Category Scores ────────────────────────────────────────────────

export interface CategoryScore {
  name: string;
  score: number;
  weight: number;
  findingsCount: number;
}

// ─── Full Scan Result ───────────────────────────────────────────────

export interface ScanResult {
  url: string;
  timestamp: number;
  overallScore: number;
  pageType: PageType;
  categories: CategoryScore[];

  crawl: CrawlResult;
  links: LinkResult;
  forms: FormResult;
  contrast: ContrastResult;
  headings: HeadingResult;
  images: ImageResult;
  meta: MetaResult;
  touchTargets: TouchTargetResult;
  console: ConsoleResult;

  allFindings: Finding[];

  aiAnalysis?: AIAnalysis;
  consultantReport?: ConsultantReport;
}

// ─── Consultant Report (CEO-level insights) ─────────────────────────

export interface TopInsight {
  headline: string;
  impact: string;
  category: string;
  severity: "high" | "medium" | "low";
  locked: boolean;
  fixes: string[];
  research: string;
}

export interface ConsultantReport {
  topInsights: TopInsight[];
  executiveSummary: string;
  industryBenchmark: string;
  detectedIndustry: string;
}

// ─── Messages between extension layers ──────────────────────────────

export interface StartScanMessage {
  type: "START_SCAN";
}

export interface ScanProgressMessage {
  type: "SCAN_PROGRESS";
  message: string;
  percent: number;
}

export interface ScanCompleteMessage {
  type: "SCAN_COMPLETE";
  result: ScanResult;
}

export interface ScanErrorMessage {
  type: "SCAN_ERROR";
  error: string;
}

export interface ShowElementMessage {
  type: "SHOW_ELEMENT";
  selector: string;
  title: string;
  description: string;
}

export interface HideElementMessage {
  type: "HIDE_ELEMENT";
}

export type ViewportMode = "desktop" | "mobile";

export interface SetViewportMessage {
  type: "SET_VIEWPORT";
  mode: ViewportMode;
}

export interface CaptureScreenshotMessage {
  type: "CAPTURE_SCREENSHOT";
}

export interface ScreenshotResultMessage {
  type: "SCREENSHOT_RESULT";
  dataUrl: string | null;
}

/** Panel → content: collect deterministic signals + anchors for a goal. */
export interface CollectGoalSignalsMessage {
  type: "COLLECT_GOAL_SIGNALS";
  goalId: GoalId;
}

/** Content → panel: the collected signals, anchors, and entry journey step. */
export interface GoalSignalsResultMessage {
  type: "GOAL_SIGNALS_RESULT";
  goalId: GoalId;
  signals: Record<string, string | number | boolean>;
  anchors: GoalAnchor[];
  navCandidates: NavCandidate[];
  entry: JourneyStep;
}

/** Panel → content: click an element to advance the journey (responds ClickElementResult). */
export interface ClickElementMessage {
  type: "CLICK_ELEMENT";
  selector: string;
}

/** Panel → content: report page scroll metrics (responds PageMetrics). */
export interface GetPageMetricsMessage {
  type: "GET_PAGE_METRICS";
}

/** Panel → content: scroll the page to an absolute Y for full-page capture. */
export interface ScrollToMessage {
  type: "SCROLL_TO";
  y: number;
}

/** Panel → content: scroll an element into view and report its rect (responds ElementRectResult). */
export interface GetElementRectMessage {
  type: "GET_ELEMENT_RECT";
  selector: string;
}

/** Panel → content: render hover-info marker pins for all friction points. */
export interface ShowGoalMarkersMessage {
  type: "SHOW_GOAL_MARKERS";
  markers: GoalMarker[];
}

/** Panel → content: remove all friction-point marker pins. */
export interface ClearGoalMarkersMessage {
  type: "CLEAR_GOAL_MARKERS";
}

export type ExtensionMessage =
  | StartScanMessage
  | ScanProgressMessage
  | ScanCompleteMessage
  | ScanErrorMessage
  | ShowElementMessage
  | HideElementMessage
  | SetViewportMessage
  | CaptureScreenshotMessage
  | ScreenshotResultMessage
  | CollectGoalSignalsMessage
  | GoalSignalsResultMessage
  | ClickElementMessage
  | GetPageMetricsMessage
  | ScrollToMessage
  | GetElementRectMessage
  | ShowGoalMarkersMessage
  | ClearGoalMarkersMessage;

// ─── API Types ──────────────────────────────────────────────────────

export interface SaveScanRequest {
  url: string;
  pageType: string;
  overallScore: number;
  viewportMode: string;
  categoryScores: CategoryScore[];
  aiAnalysis?: AIAnalysis;
  findings: Finding[];
}

export interface ScanHistoryItem {
  id: string;
  url: string;
  pageType: string;
  overallScore: number;
  viewportMode: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  plan: "free" | "pro" | "team" | "enterprise";
  createdAt: string;
}

// ─── Goal-Based UX Analysis ─────────────────────────────────────────
//
// Goal analysis asks a different question than the scanner: not "is this
// page good in general?" but "does this experience achieve THIS outcome
// for a human, given how attention, motivation, friction, and persuasion
// actually work?" It reasons through behavioral-science lenses, can span
// a multi-page journey, and grounds its qualitative verdict in
// deterministic on-page signals.

/** The five curated goals, plus a user-authored custom goal. */
export type GoalId =
  | "reach-conversion-fast"
  | "complete-the-form"
  | "capture-the-lead"
  | "read-to-the-end"
  | "build-trust-fast"
  | "custom";

/** A behavioral-science lens the analysis reasons through. */
export interface PsychologyLens {
  /** e.g. "Hick's Law", "Fogg Behavior Model", "Peak-End Rule" */
  principle: string;
  /** Plain-English meaning of the principle */
  meaning: string;
  /** How the principle applies to achieving this specific goal */
  application: string;
}

/** A deterministic metric collected on-page to ground the AI's reasoning. */
export interface GoalSignal {
  key: string;
  label: string;
  /** What it measures and why it matters to the goal */
  description: string;
}

/** A scored sub-dimension of a goal. */
export interface RubricDimension {
  key: string;
  label: string;
  /** What a high score on this dimension looks like */
  description: string;
  /** Relative weight within the goal (0-1; dimensions sum to ~1) */
  weight: number;
}

/** Static definition of a goal — its psychology, signals, and rubric. */
export interface GoalDefinition {
  id: GoalId;
  label: string;
  /** One-line description shown in the goal picker */
  tagline: string;
  /** Emoji/icon key for the picker */
  icon: string;
  /** Page types where this goal is most relevant (for smart suggestions) */
  suggestedFor: PageType[];
  /** What success concretely looks like for this goal */
  targetOutcome: string;
  /** The KPI this goal moves — drives upside teasers ("could lift {metric}") */
  upsideMetric: string;
  /** The behavioral-science lenses the analysis must reason through */
  psychologyLenses: PsychologyLens[];
  /** Deterministic signals to collect on-page and feed to the AI */
  signals: GoalSignal[];
  /** Scored sub-dimensions for this goal */
  rubric: RubricDimension[];
}

/** One friction point or opportunity found while pursuing the goal. */
export interface GoalFrictionPoint {
  id: string;
  /** Plain-English title a non-technical operator understands */
  title: string;
  /** Plain-English statement of the human behaviour at play (shown to users) */
  lens: string;
  /** Optional formal principle name for hover/reference (e.g. "Hick's Law") */
  principleName?: string;
  /** What's happening and why it works against the goal */
  diagnosis: string;
  /** Which rubric dimension key this maps to */
  dimension: string;
  severity: "blocker" | "major" | "minor";
  /** CSS selector for "Show Me" highlighting (null if cross-page/abstract) */
  selector: string | null;
  /** Journey step this was found on (0 = entry page) */
  journeyStep: number;
  /** Estimated upside if fixed, e.g. "+15-20% conversion" */
  estimatedUpside: string;
  /** Specific, actionable fixes */
  fixes: string[];
  /** Free users see this card; if locked, its detail is blurred (teaser) */
  locked: boolean;
}

/** Score for one rubric dimension within a goal analysis. */
export interface RubricScore {
  dimension: string;
  score: number; // 0-100
  rationale: string;
}

/**
 * A deterministically-located element on the page, with a real CSS selector,
 * that the AI can reference by `key` so friction points get accurate
 * "Show Me" highlighting (the AI can't invent valid selectors itself).
 */
export interface GoalAnchor {
  key: string;
  label: string;
  selector: string;
}

/** One captured step in an automated or manual journey traversal. */
export interface JourneyStep {
  index: number;
  url: string;
  pageType: PageType;
  /** The action taken to advance from here, e.g. "Clicked 'Add to Cart'" */
  actionTaken: string | null;
  /** Friction-point ids discovered on this step */
  frictionPointIds: string[];
  screenshot?: string | null;
  /** Deterministic signals captured on this step (for journey analysis) */
  signals?: Record<string, string | number | boolean>;
  /** Full-page screenshot slices (when full-page capture is used) */
  screenshots?: string[];
}

/** Full result of a goal-based UX analysis. */
export interface GoalAnalysisResult {
  goalId: GoalId;
  /** Resolved goal text (custom goals carry the user's own words) */
  goalLabel: string;
  /** 0-100: how well the experience serves this goal */
  goalScore: number;
  /** One-sentence verdict */
  verdict: string;
  /** The single biggest thing standing between the user and the goal */
  primaryBlocker: string;
  rubricScores: RubricScore[];
  frictionPoints: GoalFrictionPoint[];
  journey: JourneyStep[];
  /** Aggregate upside if the top locked fixes are applied (teaser headline) */
  projectedUpside: string;
  detectedIndustry: string;
}

/** Request body for POST /api/ai/goal-analyze. */
export interface GoalAnalyzeRequest {
  goalId: GoalId;
  /** Required when goalId === "custom" */
  customGoal?: string;
  url: string;
  industry?: string;
  /** Prior site-comprehension result, injected as ground-truth context */
  siteUnderstanding?: SiteUnderstanding;
  /** Collected deterministic signal values, keyed by GoalSignal.key */
  signals: Record<string, string | number | boolean>;
  /** Located elements with real selectors the AI can reference for Show Me */
  anchors: GoalAnchor[];
  /** Per-step journey context (entry page is index 0) */
  journey: JourneyStep[];
  /** Reuse of the standard scan for the entry page, if available */
  scanData?: {
    overallScore: number;
    pageType: string;
    categories: CategoryScore[];
    allFindings: Pick<Finding, "scanner" | "severity" | "title" | "description">[];
  };
}

// ─── Site Understanding (pre-analysis comprehension pass) ───────────

/** Structured understanding of a site, built before any goal critique. */
export interface SiteUnderstanding {
  siteIdentity?: { category?: string; whatItOffers?: string; businessModel?: string; maturitySignals?: string };
  primaryPurpose?: { primaryConversion?: string; secondaryGoals?: string[] };
  pageRole?: { pageType?: string; funnelStage?: string; jobOfThisPage?: string };
  audience?: {
    personas?: { name?: string; description?: string; sophistication?: string; intentLevel?: string; context?: string }[];
    primaryPersona?: string;
  };
  userJobs?: string[];
  userProblems?: { problem?: string; type?: string; whyItMatters?: string }[];
  valueProposition?: { promise?: string; clarity?: number; differentiation?: string; graspableInFiveSeconds?: boolean };
  informationArchitecture?: { structure?: string; navigationModel?: string; keySections?: string[] };
  howItOperates?: { primaryPaths?: string[]; keyInteractions?: string[] };
  trustPosture?: { signalsPresent?: string[]; trustRequiredByCategory?: string };
  toneAndPositioning?: string;
  categoryConventions?: { expected?: string[]; followed?: string[]; broken?: string[] };
  constraints?: string[];
  whatsWorking?: string[];
  confidenceAndUnknowns?: { inferred?: string[]; cannotKnowFromThis?: string[]; questionsForOperator?: string[] };
  audienceQuestions?: { whoIsUsingIt?: string[]; whatTheyWant?: string[] };
}

/** Request body for POST /api/ai/site-understanding. */
export interface SiteUnderstandingRequest {
  url: string;
  title?: string;
  pageType?: string;
  signals?: Record<string, string | number | boolean>;
  /** Full-page screenshot slices of the page (top → bottom). */
  screenshots?: string[];
}

// ─── Phase 3: Automated journey traversal ───────────────────────────

/** A clickable candidate the journey engine can choose to advance the flow. */
export interface NavCandidate {
  key: string;
  /** Visible label/text of the element */
  text: string;
  /** Real CSS selector to click */
  selector: string;
  kind: "link" | "button";
  /** True if above the fold (more prominent) */
  aboveFold: boolean;
}

/** Request to decide the next click toward the goal (POST /api/ai/goal-next-step). */
export interface GoalNextStepRequest {
  goalId: GoalId;
  customGoal?: string;
  url: string;
  signals: Record<string, string | number | boolean>;
  navCandidates: NavCandidate[];
  screenshot?: string | null;
  stepIndex: number;
  /** URLs already visited this journey (avoid loops) */
  visited: string[];
}

/** The engine's decision for one journey step. */
export interface GoalNextStepDecision {
  /** click = advance via candidateKey; arrived = goal reached; stuck = dead end */
  decision: "click" | "arrived" | "stuck";
  /** Which NavCandidate to click (when decision === "click") */
  candidateKey?: string | null;
  /** Human-readable action label, e.g. "Clicked 'Proceed to checkout'" */
  actionLabel?: string;
  /** Why the engine made this choice (shown to the user) */
  reason: string;
}

/** Result of clicking an element in the page (content-script → panel response). */
export interface ClickElementResult {
  ok: boolean;
  /** Refused for safety (e.g. a Pay/Submit/Delete control) */
  refused?: boolean;
  reason?: string;
  clickedText?: string;
}

/** Page scroll metrics for full-page capture. */
export interface PageMetrics {
  scrollHeight: number;
  innerHeight: number;
  innerWidth: number;
}

/** An on-page marker pin for a friction point, with hover info. */
export interface GoalMarker {
  id: string;
  selector: string;
  title: string;
  /** Short "what to change" text shown on hover */
  summary: string;
  severity: "blocker" | "major" | "minor";
}

/** Result of locating an element for thumbnail capture (content → panel). */
export interface ElementRectResult {
  ok: boolean;
  /** Viewport-relative rect after scrolling the element into view (CSS px) */
  rect?: { x: number; y: number; width: number; height: number };
  /** devicePixelRatio, to scale CSS px → captured-image px */
  dpr?: number;
  viewportW?: number;
  viewportH?: number;
}
