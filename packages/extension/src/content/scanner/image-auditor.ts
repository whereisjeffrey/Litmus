import type { ImageInfo, ImageResult, Finding } from "@placeholder/shared";
import { getReliableSelector } from "./selector-utils";

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
    const selector = getReliableSelector(img);

    // Skip images inside <noscript> tags
    if (img.closest("noscript")) return;

    // Skip trivial images: tracking pixels, spacers, invisible images
    const isTrivialImage =
      (rect.width <= 5 && rect.height <= 5) ||       // 1x1 pixels, tiny spacers
      (rect.width === 0 || rect.height === 0) ||      // invisible
      (img.naturalWidth <= 5 && img.naturalHeight <= 5) || // actual tiny image
      src.includes("pixel") ||                         // tracking pixel URLs
      src.includes("tracker") ||
      src.includes("beacon") ||
      src.includes("spacer") ||
      src.startsWith("data:image/gif;base64,R0lGOD"); // common 1x1 transparent GIF

    if (isTrivialImage) return; // skip entirely — don't report findings for trivial images

    // Skip decorative images from alt text checks
    const isDecorativeRole =
      img.getAttribute("role") === "presentation" ||
      img.getAttribute("aria-hidden") === "true";

    // Check if this image is inside a link
    const isLinkedImage = !!img.closest("a");

    // Check if alt is just a filename
    const altIsFilename = FILENAME_PATTERN.test(altText.trim());

    // Check if alt is redundant/generic
    const altIsRedundant = REDUNDANT_ALT.has(altText.trim().toLowerCase());

    // Oversized check: natural size > 3x the display size (2x is normal for retina)
    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const isOversized =
      displayWidth > 0 &&
      displayHeight > 0 &&
      naturalWidth > displayWidth * 3 &&
      naturalHeight > displayHeight * 3;

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
    if (isLinkedImage && !hasAlt && !isDecorativeRole) {
      missingAltCount++;
      const link = img.closest("a")!;
      const linkText = (link.textContent || "").trim();
      const linkAriaLabel = link.getAttribute("aria-label") || "";
      if (!linkText && !linkAriaLabel) {
        findings.push({
          id: `img-linked-noalt-${index}`,
          scanner: "image-auditor",
          severity: "critical",
          title: "Linked image no alt text",
          description: `An image inside a link has no alt attribute, and the link has no other text. This makes the link inaccessible to screen reader users.`,
          selector,
          standard: "WCAG 1.1.1",
        });
        return; // Don't double-report the missing alt
      }
    }

    // Missing alt attribute entirely (skip decorative images)
    if (!hasAlt && !isDecorativeRole) {
      missingAltCount++;
      findings.push({
        id: `img-noalt-${index}`,
        scanner: "image-auditor",
        severity: "critical",
        title: "Missing alt text",
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
        title: "Alt text is filename",
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
        title: "Redundant alt text",
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

    // Only report lazy loading issues for meaningful images (at least 50x50 pixels)
    const isMeaningfulSize = displayWidth >= 50 && displayHeight >= 50;
    const hasFetchPriorityHigh = img.getAttribute("fetchpriority") === "high";

    // Above-fold images should NOT be lazy loaded
    if (isAboveFold && hasLazyLoading && isMeaningfulSize) {
      findings.push({
        id: `img-lazyfold-${index}`,
        scanner: "image-auditor",
        severity: "info",
        title: "Lazy load above fold",
        description:
          `This image (${Math.round(displayWidth)}x${Math.round(displayHeight)}px) is visible in the initial viewport but has loading="lazy". Above-fold images should load eagerly for best LCP performance.`,
        selector,
        standard: null,
      });
    }

    // Below-fold images without lazy loading — only flag large images
    // Don't flag images with fetchpriority="high" — they're already optimized
    if (!isAboveFold && !hasLazyLoading && !hasFetchPriorityHigh && isMeaningfulSize && displayWidth >= 200) {
      findings.push({
        id: `img-nolazy-${index}`,
        scanner: "image-auditor",
        severity: "info",
        title: "No lazy loading",
        description:
          `This image (${Math.round(displayWidth)}x${Math.round(displayHeight)}px) is below the fold and could benefit from loading="lazy" to defer loading until the user scrolls near it.`,
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
        title: "No responsive srcset",
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
    const selector = getReliableSelector(svg);

    // Skip SVGs inside <noscript> tags
    if (svg.closest("noscript")) return;

    // Skip decorative SVGs that are properly marked
    if (ariaHidden === "true") return;

    // Skip SVGs inside buttons or links that already have text (the SVG is decorative)
    const interactiveParent = svg.closest("a, button, [role='button']");
    const interactiveParentText = interactiveParent
      ? (interactiveParent.textContent || "").trim()
      : "";
    if (interactiveParent && interactiveParentText) {
      // Track in images array but don't flag — it's decorative alongside text
      const rect = svg.getBoundingClientRect();
      images.push({
        src: "",
        alt: ariaLabel || titleEl?.textContent || "",
        selector,
        hasAlt: true, // effectively decorative, not a problem
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
      return;
    }

    // SVG with no accessible name and no aria-hidden
    const hasAccessibleName = !!(ariaLabel || ariaLabelledBy || titleEl);
    const hasImgRole = role === "img";

    if (!hasAccessibleName && !hasImgRole) {
      findings.push({
        id: `svg-no-accessible-name-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "SVG no accessible name",
        description:
          "This SVG has no role=\"img\", aria-label, aria-labelledby, or <title> element. If informative, add role=\"img\" and an aria-label. If decorative, add aria-hidden=\"true\".",
        selector,
        standard: "WCAG 1.1.1",
      });
    } else if (hasImgRole && !hasAccessibleName) {
      findings.push({
        id: `svg-role-no-label-${index}`,
        scanner: "image-auditor",
        severity: "warning",
        title: "SVG no accessible name",
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
          title: "Background image info",
          description: `This element uses a CSS background image and appears to convey content. If informative, add role="img" and aria-label. Element: <${el.tagName.toLowerCase()}>.`,
          selector: getReliableSelector(el),
          standard: "WCAG 1.1.1",
        });
      }
    }
  });

  return { images, missingAltCount, oversizedCount, findings };
}
