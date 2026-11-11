import { chromium, type Browser, type Page } from "playwright";

/**
 * BrowserSession — the walker's hands and eyes.
 *
 * A thin, guard-railed wrapper around Playwright that exposes exactly the
 * actions the walk agent is allowed to take. The LLM never touches Playwright
 * directly; every action goes through here so guardrails cannot be bypassed.
 */

export interface SessionGuardrails {
  /** Hard cap on actions per walk */
  maxSteps: number;
  /** Restrict navigation to the start URL's site — same registrable domain,
   *  subdomains included, so peddle.com → www.peddle.com / sell.peddle.com
   *  are allowed (default true) */
  sameOriginOnly: boolean;
  /** URLs matching any pattern are refused (destructive/irreversible paths) */
  blockedUrlPatterns: RegExp[];
}

export const DEFAULT_GUARDRAILS: SessionGuardrails = {
  maxSteps: 40,
  sameOriginOnly: true,
  blockedUrlPatterns: [
    /logout|signout|sign-out/i,
    /delete|destroy|remove-account/i,
    /unsubscribe/i,
  ],
};

export interface ElementDigestEntry {
  tag: string;
  text: string;
  selector: string;
  x: number;
  y: number;
  w: number;
  h: number;
  inViewport: boolean;
}

export interface PageObservation {
  url: string;
  title: string;
  scrollY: number;
  pageHeight: number;
  viewportHeight: number;
  elements: ElementDigestEntry[];
}

export class GuardrailViolation extends Error {}

/** Last two labels of a hostname — a registrable-domain approximation that
 *  lets walks follow www./sell./app. subdomains. (Mis-groups multi-part TLDs
 *  like .co.uk; swap in a public-suffix-list lookup if that ever bites.) */
function siteDomain(hostname: string): string {
  return hostname.split(".").slice(-2).join(".");
}

export class BrowserSession {
  private constructor(
    private browser: Browser,
    private page: Page,
    private origin: string,
    private guardrails: SessionGuardrails
  ) {}

  stepCount = 0;

  static async launch(
    startUrl: string,
    guardrails: SessionGuardrails = DEFAULT_GUARDRAILS,
    viewport = { width: 1280, height: 800 }
  ): Promise<BrowserSession> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport });
    const session = new BrowserSession(browser, page, new URL(startUrl).origin, guardrails);
    await session.navigate(startUrl);
    return session;
  }

  private checkStepBudget(): void {
    this.stepCount++;
    if (this.stepCount > this.guardrails.maxSteps) {
      throw new GuardrailViolation(
        `Step budget of ${this.guardrails.maxSteps} exceeded — the walk must finish.`
      );
    }
  }

  private checkUrl(url: string): void {
    const parsed = new URL(url, this.page.url() || this.origin);
    if (!/^https?:$/.test(parsed.protocol)) {
      throw new GuardrailViolation(`Navigation to ${parsed.href} refused (non-http scheme).`);
    }
    if (
      this.guardrails.sameOriginOnly &&
      siteDomain(parsed.hostname) !== siteDomain(new URL(this.origin).hostname)
    ) {
      throw new GuardrailViolation(
        `Navigation to ${parsed.origin} refused — the walk stays on ${this.origin} and its subdomains.`
      );
    }
    for (const pattern of this.guardrails.blockedUrlPatterns) {
      if (pattern.test(parsed.href)) {
        throw new GuardrailViolation(`Navigation to ${parsed.href} refused (blocked pattern).`);
      }
    }
  }

  async navigate(url: string): Promise<void> {
    this.checkStepBudget();
    this.checkUrl(url);
    await this.page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await this.page.waitForTimeout(500); // let late paints settle
  }

  async click(selector: string): Promise<void> {
    this.checkStepBudget();
    await this.page.click(selector, { timeout: 8_000 });
    await this.page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => {});
    await this.page.waitForTimeout(500);
    // A click may have navigated somewhere disallowed — enforce after the fact
    this.checkUrl(this.page.url());
  }

  async typeText(selector: string, text: string): Promise<void> {
    this.checkStepBudget();
    await this.page.fill(selector, text, { timeout: 8_000 });
  }

  async scroll(direction: "up" | "down"): Promise<void> {
    this.checkStepBudget();
    const delta = direction === "down" ? 700 : -700;
    await this.page.mouse.wheel(0, delta);
    await this.page.waitForTimeout(400);
  }

  /** JPEG viewport screenshot */
  async screenshot(): Promise<Buffer> {
    return this.page.screenshot({ type: "jpeg", quality: 70 });
  }

  /** Compact interactive-element inventory of the current DOM state. */
  async observe(maxElements = 60): Promise<PageObservation> {
    const raw = await this.page.evaluate((max) => {
      // tsx/esbuild injects __name() helper calls into nested functions when
      // serializing this callback; provide a no-op so it runs in the browser.
      (globalThis as unknown as Record<string, unknown>).__name = (fn: unknown) => fn;
      const INTERACTIVE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "LABEL", "H1", "H2", "H3"]);
      const cssPath = (el: Element): string => {
        const parts: string[] = [];
        let node: Element | null = el;
        while (node && node.nodeType === 1 && parts.length < 5) {
          let part = node.tagName.toLowerCase();
          if (node.id) {
            parts.unshift(`#${node.id}`);
            break;
          }
          const parent: Element | null = node.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
            if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
          }
          parts.unshift(part);
          node = parent;
        }
        return parts.join(" > ");
      };

      const out: Array<Record<string, unknown>> = [];
      const all = document.querySelectorAll("*");
      for (let i = 0; i < all.length && out.length < max; i++) {
        const el = all[i];
        const role = el.getAttribute("role");
        if (!INTERACTIVE.has(el.tagName) && role !== "button" && role !== "link") continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const text = (
          el.textContent ||
          el.getAttribute("aria-label") ||
          el.getAttribute("placeholder") ||
          ""
        ).trim().slice(0, 80);
        out.push({
          tag: el.tagName.toLowerCase(),
          text,
          selector: cssPath(el),
          x: Math.round(rect.x),
          y: Math.round(rect.y + window.scrollY),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          inViewport: rect.y >= 0 && rect.y < window.innerHeight,
        });
      }
      return {
        elements: out,
        scrollY: window.scrollY,
        pageHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
      };
    }, maxElements);

    return {
      url: this.page.url(),
      title: await this.page.title(),
      scrollY: raw.scrollY,
      pageHeight: raw.pageHeight,
      viewportHeight: raw.viewportHeight,
      elements: raw.elements as unknown as ElementDigestEntry[],
    };
  }

  async close(): Promise<void> {
    await this.browser.close();
  }
}
