import type { ConsoleError, ConsoleResult, Finding } from "@placeholder/shared";

/**
 * Captured errors are stored in this module-level array.
 * The hooks install once and accumulate errors until collectConsoleErrors() is called.
 */
let capturedErrors: ConsoleError[] = [];
let isInstalled = false;

/** Maximum number of errors to store to prevent memory issues */
const MAX_CAPTURED_ERRORS = 200;

/** Pattern to identify our own extension's errors (to filter them out) */
const EXTENSION_PATTERNS = [
  "chrome-extension://",
  "moz-extension://",
  "@placeholder/",
  "placeholder-extension",
  "litmus-extension",
];

/**
 * Checks if an error originated from our own extension.
 */
function isOwnExtensionError(source: string | null, message: string): boolean {
  const text = `${source || ""} ${message}`.toLowerCase();
  return EXTENSION_PATTERNS.some((pat) => text.includes(pat.toLowerCase()));
}

/**
 * Adds an error to the capture list if under the limit.
 */
function addError(error: ConsoleError): void {
  if (capturedErrors.length >= MAX_CAPTURED_ERRORS) return;
  if (isOwnExtensionError(error.source, error.message)) return;
  capturedErrors.push(error);
}

/**
 * Installs global error hooks. Call this as early as possible (ideally at
 * content script load time) so errors that fire before the scan starts
 * are still captured.
 */
export function installErrorHooks(): void {
  if (isInstalled) return;
  isInstalled = true;

  // window.onerror catches runtime errors and syntax errors in scripts
  const originalOnError = window.onerror;
  window.onerror = (
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    _error?: Error
  ) => {
    const msg = typeof message === "string" ? message : message.type;
    addError({
      message: msg,
      source: source || null,
      line: lineno || null,
      column: colno || null,
      timestamp: Date.now(),
      type: "error",
    });
    // Call original handler if it exists
    if (typeof originalOnError === "function") {
      return originalOnError(message, source, lineno, colno, _error);
    }
    return false;
  };

  // Catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";

    const source =
      reason instanceof Error
        ? reason.stack?.split("\n")[1]?.trim() || null
        : null;

    addError({
      message,
      source,
      line: null,
      column: null,
      timestamp: Date.now(),
      type: "unhandledrejection",
    });
  });

  // Catch CSP violations
  document.addEventListener("securitypolicyviolation", (event) => {
    addError({
      message: `CSP violation: blocked ${event.violatedDirective} from ${event.blockedURI || "inline"}`,
      source: event.sourceFile || null,
      line: event.lineNumber || null,
      column: event.columnNumber || null,
      timestamp: Date.now(),
      type: "csp-violation",
    });
  });

  // Also capture errors from error events on the window (resource loading failures)
  window.addEventListener(
    "error",
    (event: ErrorEvent) => {
      // Avoid double-counting errors already caught by window.onerror
      if (event.message) return;
      const target = event.target as HTMLElement | null;
      if (target && "src" in target) {
        const src =
          (target as HTMLImageElement).src ||
          (target as HTMLScriptElement).src ||
          "";
        addError({
          message: `Failed to load resource: ${src}`,
          source: src || null,
          line: null,
          column: null,
          timestamp: Date.now(),
          type: "error",
        });
      }
    },
    true // capture phase to catch resource errors
  );
}

/**
 * Collects all captured errors since the hooks were installed and
 * produces findings. Call this during the scan orchestration.
 */
export function collectConsoleErrors(): ConsoleResult {
  const errors = [...capturedErrors];
  const findings: Finding[] = [];

  if (errors.length > 0) {
    // Group similar errors
    const uniqueMessages = new Set(errors.map((e) => e.message));
    const cspErrors = errors.filter((e) => e.type === "csp-violation");
    const rejections = errors.filter((e) => e.type === "unhandledrejection");
    const runtimeErrors = errors.filter((e) => e.type === "error");

    if (errors.length <= 5) {
      // Show individual findings for a small number of errors
      errors.forEach((err, i) => {
        findings.push({
          id: `console-error-${i}`,
          scanner: "console-capture",
          severity: err.type === "csp-violation" ? "warning" : "critical",
          title:
            err.type === "csp-violation"
              ? "CSP violation"
              : err.type === "unhandledrejection"
                ? "Promise rejection"
                : "JS runtime error",
          description: `${err.message}${err.source ? ` (${err.source}${err.line ? `:${err.line}` : ""})` : ""} [${new Date(err.timestamp).toLocaleTimeString()}]`,
          selector: null,
          standard: null,
        });
      });
    } else {
      // Summarize for many errors
      findings.push({
        id: "console-errors-summary",
        scanner: "console-capture",
        severity: "critical",
        title: `${errors.length} JavaScript errors detected`,
        description: `Found ${uniqueMessages.size} unique error(s): ${runtimeErrors.length} runtime, ${rejections.length} promise rejections, ${cspErrors.length} CSP violations. Most common: "${errors[0].message.slice(0, 80)}"`,
        selector: null,
        standard: null,
      });

      // Also show CSP violations individually as they're actionable
      if (cspErrors.length > 0 && cspErrors.length <= 3) {
        cspErrors.forEach((err, i) => {
          findings.push({
            id: `console-csp-${i}`,
            scanner: "console-capture",
            severity: "warning",
            title: "CSP violation",
            description: `${err.message} [${new Date(err.timestamp).toLocaleTimeString()}]`,
            selector: null,
            standard: null,
          });
        });
      }
    }
  }

  // Note if we hit the capture limit
  if (capturedErrors.length >= MAX_CAPTURED_ERRORS) {
    findings.push({
      id: "console-overflow",
      scanner: "console-capture",
      severity: "warning",
      title: `Error capture limit reached (${MAX_CAPTURED_ERRORS}+)`,
      description: `This page generated more than ${MAX_CAPTURED_ERRORS} errors. Only the first ${MAX_CAPTURED_ERRORS} were captured. This may indicate a serious issue.`,
      selector: null,
      standard: null,
    });
  }

  return { errors, findings };
}
