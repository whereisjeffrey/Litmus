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

export type ExtensionMessage =
  | StartScanMessage
  | ScanProgressMessage
  | ScanCompleteMessage
  | ScanErrorMessage
  | ShowElementMessage
  | HideElementMessage
  | SetViewportMessage;

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
