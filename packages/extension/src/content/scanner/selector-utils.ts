/**
 * Shared utility for generating reliable CSS selectors across all scanners.
 * Tries multiple strategies in order of reliability:
 * 1. ID (most reliable)
 * 2. data-testid or data-cy attribute (common in tested apps)
 * 3. Unique aria-label
 * 4. Tag + unique class combination
 * 5. Tag + nth-of-type with parent context (2 levels max)
 */

/** Class patterns that are dynamic/generated and should be skipped. */
const DYNAMIC_CLASS_RE =
  /^(_[a-z0-9]{4,}|css-[a-z0-9]+|sc-[a-zA-Z]+|svelte-[a-z0-9]+|emotion-[a-z0-9]+|styled-[a-z0-9]+|[a-zA-Z]{1,3}[A-Z][a-zA-Z0-9]{3,8}$)/;

/** Utility/layout classes that are too generic to use as selectors. */
const UTILITY_CLASS_RE =
  /^(flex|grid|block|inline|hidden|visible|relative|absolute|fixed|sticky|static|overflow|text-(xs|sm|base|lg|xl|2xl|3xl|left|right|center)|font-(bold|normal|medium|light|semibold)|p[xytblr]?-\d|m[xytblr]?-\d|w-|h-|min-|max-|gap-|space-|rounded|border|shadow|bg-|opacity-|z-|cursor-|transition|duration|ease|transform|scale|rotate|translate|sr-only|not-sr-only|container|col-|row-|justify-|items-|self-|order-|grow|shrink|basis-)/;

const MAX_SELECTOR_LENGTH = 100;

/**
 * Checks whether a class name is suitable for use in a selector.
 */
function isUsableClass(cls: string): boolean {
  if (!cls || cls.length < 2) return false;
  if (DYNAMIC_CLASS_RE.test(cls)) return false;
  if (UTILITY_CLASS_RE.test(cls)) return false;
  // Skip classes that look like hashes (random alphanumeric strings)
  if (/^[a-zA-Z]{0,2}[0-9a-f]{5,}$/i.test(cls)) return false;
  return true;
}

/**
 * Checks if a selector uniquely identifies one element on the page.
 */
function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

/**
 * Generates the most reliable CSS selector possible for an element.
 */
export function getReliableSelector(el: Element): string {
  // Strategy 1: ID
  if (el.id) {
    const sel = `#${CSS.escape(el.id)}`;
    if (isUnique(sel)) return sel;
  }

  // Strategy 2: data-testid or data-cy
  const testId = el.getAttribute("data-testid") || el.getAttribute("data-cy");
  if (testId) {
    const sel = `[data-testid="${CSS.escape(testId)}"]`;
    if (isUnique(sel)) return sel;
    const sel2 = `[data-cy="${CSS.escape(testId)}"]`;
    if (isUnique(sel2)) return sel2;
  }

  // Strategy 3: Unique aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) {
    const sel = `${el.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`;
    if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
  }

  // Strategy 3b: name attribute (useful for form elements)
  const name = el.getAttribute("name");
  if (name) {
    const sel = `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
    if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
  }

  // Strategy 4: Tag + unique class combination
  if (el.className && typeof el.className === "string") {
    const classes = el.className.trim().split(/\s+/).filter(isUsableClass);
    if (classes.length > 0) {
      // Try each class individually first (simplest selector)
      const tag = el.tagName.toLowerCase();
      for (const cls of classes.slice(0, 3)) {
        const sel = `${tag}.${CSS.escape(cls)}`;
        if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
      }
      // Try combinations of up to 2 classes
      if (classes.length >= 2) {
        for (let i = 0; i < Math.min(classes.length, 3); i++) {
          for (let j = i + 1; j < Math.min(classes.length, 4); j++) {
            const sel = `${tag}.${CSS.escape(classes[i])}.${CSS.escape(classes[j])}`;
            if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
          }
        }
      }
    }
  }

  // Strategy 5: Tag + nth-of-type with parent context (up to 2 levels)
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (parent) {
    const sameTagSiblings = Array.from(parent.children).filter(
      (s) => s.tagName === el.tagName
    );
    const nthIndex = sameTagSiblings.indexOf(el) + 1;
    const nthPart =
      sameTagSiblings.length > 1 ? `${tag}:nth-of-type(${nthIndex})` : tag;

    // Try with parent ID
    if (parent.id) {
      const sel = `#${CSS.escape(parent.id)} > ${nthPart}`;
      if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
    }

    // Try with parent tag + class
    if (parent.className && typeof parent.className === "string") {
      const parentClasses = parent.className
        .trim()
        .split(/\s+/)
        .filter(isUsableClass);
      for (const pcls of parentClasses.slice(0, 2)) {
        const sel = `${parent.tagName.toLowerCase()}.${CSS.escape(pcls)} > ${nthPart}`;
        if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
      }
    }

    // Try with semantic parent tag
    const semanticParents = ["main", "nav", "header", "footer", "aside", "section", "article", "form"];
    if (semanticParents.includes(parent.tagName.toLowerCase())) {
      const sel = `${parent.tagName.toLowerCase()} > ${nthPart}`;
      if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
    }

    // Try grandparent context
    const grandparent = parent.parentElement;
    if (grandparent) {
      if (grandparent.id) {
        const sel = `#${CSS.escape(grandparent.id)} ${nthPart}`;
        if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
      }
      if (semanticParents.includes(grandparent.tagName.toLowerCase())) {
        const parentTag = parent.tagName.toLowerCase();
        const sel = `${grandparent.tagName.toLowerCase()} > ${parentTag} > ${nthPart}`;
        if (sel.length <= MAX_SELECTOR_LENGTH && isUnique(sel)) return sel;
      }
    }

    // Fallback: just tag:nth-of-type at current level
    if (sameTagSiblings.length > 1) {
      return `${tag}:nth-of-type(${nthIndex})`;
    }
  }

  // Final fallback: tag name
  return tag;
}
