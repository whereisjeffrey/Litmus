import * as fs from "fs";
import * as path from "path";

/**
 * Loads the UX knowledge base (knowledge/*.md at the repo root) for prompt
 * injection. Files are matched by page type and industry, cached in memory,
 * and size-capped so a runaway file can't blow up the context window.
 *
 * universal.md is deliberately NOT loaded: it covers the quantitative layer
 * (contrast, alt text, touch targets) that the deterministic scanners already
 * measure — injecting it pulls the consultant back into technical-auditor
 * mode and duplicates findings the user already has for free.
 */

const MAX_FILE_CHARS = 24_000;

/** PageType display value → knowledge file basename */
const PAGE_TYPE_FILES: Record<string, string> = {
  "Landing Page": "landing.md",
  "Pricing Page": "pricing.md",
  "Checkout": "checkout.md",
  "Signup / Register": "signup.md",
  "Login": "login.md",
  "Dashboard / App": "dashboard.md",
  "Blog / Article": "blog.md",
  "Product Page": "product.md",
  "Homepage": "homepage.md",
};

const INDUSTRY_FILES: Record<string, string> = {
  saas: "industries/saas.md",
  ecommerce: "industries/ecommerce.md",
  fintech: "industries/fintech.md",
  medical: "industries/medical.md",
  "professional-services": "industries/professional-services.md",
  "real-estate": "industries/real-estate.md",
};

let knowledgeDir: string | null | undefined;

/** Walk up from cwd to find the repo-root knowledge/ directory. */
function findKnowledgeDir(): string | null {
  if (knowledgeDir !== undefined) return knowledgeDir;

  if (process.env.KNOWLEDGE_DIR && fs.existsSync(process.env.KNOWLEDGE_DIR)) {
    knowledgeDir = process.env.KNOWLEDGE_DIR;
    return knowledgeDir;
  }

  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, "knowledge");
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      knowledgeDir = candidate;
      return knowledgeDir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  console.warn("[knowledge] knowledge/ directory not found — prompts will run without the knowledge base");
  knowledgeDir = null;
  return knowledgeDir;
}

const fileCache = new Map<string, string | null>();

function readKnowledgeFile(relPath: string): string | null {
  if (fileCache.has(relPath)) return fileCache.get(relPath) ?? null;

  const dir = findKnowledgeDir();
  if (!dir) {
    fileCache.set(relPath, null);
    return null;
  }

  try {
    const content = fs.readFileSync(path.join(dir, relPath), "utf-8").slice(0, MAX_FILE_CHARS);
    fileCache.set(relPath, content);
    return content;
  } catch {
    fileCache.set(relPath, null);
    return null;
  }
}

export interface KnowledgeBundle {
  /** Page-type playbook rules, or null if no file matches */
  pageTypeRules: string | null;
  /** Industry-specific rules, or null for "general" / no file */
  industryRules: string | null;
}

export function loadKnowledge(pageType: string, industry: string): KnowledgeBundle {
  const pageFile = PAGE_TYPE_FILES[pageType];
  const industryFile = INDUSTRY_FILES[industry];

  return {
    pageTypeRules: pageFile ? readKnowledgeFile(pageFile) : null,
    industryRules: industryFile ? readKnowledgeFile(industryFile) : null,
  };
}
