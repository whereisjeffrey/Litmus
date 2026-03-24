import type { ImageInfo, ImageResult, Finding } from "@placeholder/shared";

/**
 * Common filename patterns that indicate the alt text is just a filename.
 */
const FILENAME_PATTERN = /\.(jpg|jpeg|png|gif|svg|webp|avif|bmp|ico)(\?.*)?$/i;

/**
 * Common redundant alt text patterns.
 */
const REDUNDANT_ALT = new Set([
  "image",
  "photo",
  "picture",
  "icon",
  "logo",
  "banner",
  "graphic",
  "img",
  "untitled",
  "screenshot",
  "thumbnail",
]);

/**
 * Generates a unique selector for an image element.
 */
function getImgSelector(img: HTMLImageElement, index: number): string {
  if (img.id) return `#${CSS.escape(img.id)}`;
  const src = img.getAttribute("src") || "";
  if (src) return `img[src="${CSS.escape(src.slice(0, 80))}"]`;
  return `img:nth-of-type(${index + 1})`;
}

/**
 * Audits all images on the page for alt text quality, sizing, lazy loading,
 * SVG accessibility, linked images, and responsive image attributes.
 */
export function auditImages(): ImageResult {
  const imgElements = document.querySelectorAll("img");
  const images: ImageInfo[] = [];
  const findings: Finding[] = [];
  let missingAltCount = 0;
  let oversizedCount = 0;

  imgElements.forEach((img, index) => {
    const src = img.getAttribute("src") || img.currentSrc || "";
    const alt = img.getAttribute("alt");
    const hasAlt = alt !== null;
    const altText = alt || "";
    const rect = img.getBoundingClientRect();
    const selector = getImgSelector(img, index);

    // Check if this image is inside a link
    const isLinkedImage = !!img.closest("a");

    // Check if alt is just a filename
    const altIsFilename = FILENAME_PATTERN.test(altText.trim());

    // Check if alt is redundant/generic
    const altIsRedundant = REDUNDANT_ALT.has(altText.trim().toLowerCase());

    // Oversized check: natural size > 2x the display size
    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const isOversized =
      displayWidth > 0 &&
      displayHeight > 0 &&
      naturalWidth > displayWidth * 2 &&
      naturalHeight > displayHeight * 2;

    // Lazy loading check
    const hasLazyLoading = img.loading === "lazy";

    // Above the fold (within initial viewport)
    const isAboveFold = rect.top < window.innerHeight && rect.top >= 0;

    // srcset check
    const hasSrcset = !!(img.getAttribute("srcset") || img.getAttribute("sizes"));

    const info: ImageInfo = {
      src: src.slice(0, 200),
      alt: altText.slice(0, 200),
      selector,
      hasAlt,
      altIsFilename,
      altIsRedundant,
      naturalWidth,
      naturalHeight,
      displayWidth: Math.round(displayWidth),
      displayHeight: Math.round(displayHeight),
      isOversized,
      hasLazyLoading,
      isAboveFold,
      isLinkedImage,
      isSvg: false,
      hasSrcset,
    };

    images.push(info);

    // === Critical: Linked image without alt text ===
    if (isLinkedImage && !hasAlt) {
      missingAltCount++;
      const link = img.closest("a")!;
      const linkText = (link.textContent || "").trim();
      const linkAriaLabel = link.getAttribute("aria-label") || "";
      if (!linkText && !linkAriaLabel) {
        findings.push({
          id: `img-linked-noalt-${index}`,
          scanner: "image-auditor",
          severity: "critical",
          title: "Linked image missing alt text",
          description: `An image inside a link has no alt attribute, and the link has no other text. This makes the link inaccessible to screen reader users.`,
          selector,
          standard: "WCAG 1.1.1",
        });
        return; // Don't double-report the missing alt
      }
    }

    // Missing alt attribute entirely
    if (!hasAlt) {
      missingAltCount++;
      findings.push({
        id: `img-noalt-${index}`,
        scanner: "image-auditor",
        severity: "critical",
        title: "Image missing alt attribute",
        description: `An image${src ? ` (src: ...${src.slice(-40)})` : ""} has no alt attribute. If decorative, use alt="". Otherwise, provide descriptive text.`,
        selector,
        standard: "WCAG 1.1.1",
      });
    }

    // Alt is a filename
    if (hasAlt && altIsFilename) {
      findings.push({
        id: `img-altfile-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "Image alt text is a filename",
        description: `Alt text "${altText.slice(0, 50)}" appears to be a filename. Provide a meaningful description instead.`,
        selector,
        standard: "WCAG 1.1.1",
      });
    }

    // Alt is redundant
    if (hasAlt && altIsRedundant) {
      findings.push({
        id: `img-altredundant-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "Image alt text is generic",
        description: `Alt text "${altText}" doesn't describe the image's content or purpose. Use specific, descriptive text.`,
        selector,
        standard: "WCAG 1.1.1",
      });
    }

    // Oversized image
    if (isOversized) {
      oversizedCount++;
      const ratio = Math.round(
        ((naturalWidth * naturalHeight) / (displayWidth * displayHeight)) * 10
      ) / 10;
      findings.push({
        id: `img-oversized-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "Oversized image",
        description: `Image is ${naturalWidth}x${naturalHeight} but displayed at ${Math.round(displayWidth)}x${Math.round(displayHeight)} (${ratio}x larger than needed). Serve a properly sized image to save bandwidth.`,
        selector,
        standard: null,
      });
    }

    // Above-fold images should NOT be lazy loaded
    if (isAboveFold && hasLazyLoading) {
      findings.push({
        id: `img-lazyfold-${index}`,
        scanner: "image-auditor",
        severity: "info",
        title: "Above-fold image uses lazy loading",
        description:
          "This image is visible in the initial viewport but has loading=\"lazy\". Above-fold images should load eagerly for best LCP performance.",
        selector,
        standard: null,
      });
    }

    // Below-fold images without lazy loading
    if (!isAboveFold && !hasLazyLoading && displayWidth > 0) {
      findings.push({
        id: `img-nolazy-${index}`,
        scanner: "image-auditor",
        severity: "info",
        title: "Below-fold image without lazy loading",
        description:
          "This image is below the fold and could benefit from loading=\"lazy\" to defer loading until the user scrolls near it.",
        selector,
        standard: null,
      });
    }

    // Large responsive images without srcset
    if (!hasSrcset && displayWidth > 200 && naturalWidth > 400) {
      findings.push({
        id: `img-nosrcset-${index}`,
        scanner: "image-auditor",
        severity: "info",
        title: "Large image without srcset/sizes",
        description: `This ${naturalWidth}px wide image has no srcset attribute. Using srcset allows browsers to load smaller images on smaller screens, saving bandwidth.`,
        selector,
        standard: null,
      });
    }
  });

  // === SVG accessibility audit ===
  const svgElements = document.querySelectorAll("svg");
  svgElements.forEach((svg, index) => {
    const role = svg.getAttribute("role");
    const ariaLabel = svg.getAttribute("aria-label");
    const ariaLabelledBy = svg.getAttribute("aria-labelledby");
    const titleEl = svg.querySelector("title");
    const ariaHidden = svg.getAttribute("aria-hidden");
    const selector = svg.id
      ? `#${CSS.escape(svg.id)}`
      : `svg:nth-of-type(${index + 1})`;

    // Skip decorative SVGs that are properly marked
    if (ariaHidden === "true") return;

    // SVG with no accessible name and no aria-hidden
    const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || titleEl);
    const hasImgRole = role === "img";

    if (!hasAccessibleName && !hasImgRole) {
      // Check if it seems decorative (small, inside a button/link that has text)
      const parent = svg.closest("a, button, [role='button']");
      const parentText = parent ? (parent.textContent || "").trim() : "";
      if (parent && parentText) {
        // Likely decorative icon next to text — just needs aria-hidden
        findings.push({
          id: `svg-no-ariahidden-${index}`,
          scanner: "image-auditor",
          severity: "info",
          title: "Decorative SVG should have aria-hidden=\"true\"",
          description:
            "This SVG appears decorative (inside an interactive element with text). Add aria-hidden=\"true\" to hide it from screen readers.",
          selector,
          standard: "WCAG 1.1.1",
        });
      } else {
        findings.push({
          id: `svg-no-accessible-name-${index}`,
          scanner: "image-auditor",
          severity: "warning",
          title: "SVG missing accessible name",
          description:
            "This SVG has no role=\"img\", aria-label, aria-labelledby, or <title> element. If informative, add role=\"img\" and an aria-label. If decorative, add aria-hidden=\"true\".",
          selector,
          standard: "WCAG 1.1.1",
        });
      }
    } else if (hasImgRole && !hasAccessibleName) {
      findings.push({
        id: `svg-role-no-label-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "SVG has role=\"img\" but no accessible name",
        description:
          "This SVG has role=\"img\" but no aria-label, aria-labelledby, or <title>. Add a label to describe the image.",
        selector,
        standard: "WCAG 1.1.1",
      });
    }

    // Track SVGs in the images array for completeness
    const rect = svg.getBoundingClientRect();
    images.push({
      src: "",
      alt: ariaLabel || titleEl?.textContent || "",
      selector,
      hasAlt: hasAccessibleName,
      altIsFilename: false,
      altIsRedundant: false,
      naturalWidth: 0,
      naturalHeight: 0,
      displayWidth: Math.round(rect.width),
      displayHeight: Math.round(rect.height),
      isOversized: false,
      hasLazyLoading: false,
      isAboveFold: rect.top < window.innerHeight && rect.top >= 0,
      isLinkedImage: !!svg.closest("a"),
      isSvg: true,
      hasSrcset: false,
    });
  });

  // === Flag potential informational CSS background images ===
  // Heuristic: elements with background-image that are large, have no text, and no child content
  const bgCandidates = document.querySelectorAll(
    '[class*="hero"], [class*="banner"], [class*="background"], [class*="bg-"], [role="img"]'
  );
  bgCandidates.forEach((el, index) => {
    const style = window.getComputedStyle(el);
    if (style.backgroundImage && style.backgroundImage !== "none") {
      const rect = el.getBoundingClientRect();
      const text = (el.textContent || "").trim();
      const ariaLabel = el.getAttribute("aria-label");
      const role = el.getAttribute("role");

      // Large background image with no text alternative
      if (rect.width > 200 && rect.height > 100 && !ariaLabel && role !== "img") {
        findings.push({
          id: `bg-img-no-alt-${index}`,
          scanner: "image-auditor",
          severity: "info",
          title: "CSS background image may need text alternative",
          description: `This element uses a CSS background image and appears to convey content. If informative, add role="img" and aria-label. Element: <${el.tagName.toLowerCase()}>.`,
          selector: el.id ? `#${CSS.escape(el.id)}` : el.tagName.toLowerCase(),
          standard: "WCAG 1.1.1",
        });
      }
    }
  });

  return { images, missingAltCount, oversizedCount, findings };
}
