/**
 * Viewport simulator for mobile preview.
 * Injects CSS to constrain the page to a mobile width (390px, iPhone 15)
 * so users can scan the mobile version without opening DevTools.
 *
 * All injected styles use !important and are namespaced with __litmus_vp
 * to avoid conflicts with host page styles.
 */

const STYLE_ID = "__litmus_vp_style";
const BANNER_ID = "__litmus_vp_banner";
const MOBILE_WIDTH = 390;

let originalViewportContent: string | null = null;
let viewportMetaModified = false;

export function setMobileViewport(): void {
  // Don't double-inject
  if (document.getElementById(STYLE_ID)) return;

  // Save and modify viewport meta tag if it exists
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    originalViewportContent = viewportMeta.getAttribute("content");
    viewportMeta.setAttribute("content", `width=${MOBILE_WIDTH}`);
    viewportMetaModified = true;
  }

  // Inject constraining styles
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html.__litmus_vp_active {
      max-width: ${MOBILE_WIDTH}px !important;
      margin: 0 auto !important;
      overflow-x: hidden !important;
      position: relative !important;
      box-shadow: 1px 0 0 0 #94a3b8, -1px 0 0 0 #94a3b8 !important;
    }
    html.__litmus_vp_active body {
      max-width: ${MOBILE_WIDTH}px !important;
      overflow-x: hidden !important;
    }
    #${BANNER_ID} {
      position: fixed !important;
      top: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      z-index: 2147483647 !important;
      background: #1e293b !important;
      color: #e2e8f0 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 11px !important;
      font-weight: 500 !important;
      padding: 4px 12px !important;
      border-radius: 0 0 6px 6px !important;
      letter-spacing: 0.02em !important;
      pointer-events: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
      white-space: nowrap !important;
    }
  `;
  document.head.appendChild(style);

  // Add class to html element to activate styles
  document.documentElement.classList.add("__litmus_vp_active");

  // Add banner indicator
  const banner = document.createElement("div");
  banner.id = BANNER_ID;
  banner.textContent = `Mobile Preview (${MOBILE_WIDTH}px)`;
  document.body.appendChild(banner);
}

export function setDesktopViewport(): void {
  // Remove injected style
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();

  // Remove banner
  const banner = document.getElementById(BANNER_ID);
  if (banner) banner.remove();

  // Remove class from html element
  document.documentElement.classList.remove("__litmus_vp_active");

  // Restore original viewport meta tag
  if (viewportMetaModified) {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta && originalViewportContent !== null) {
      viewportMeta.setAttribute("content", originalViewportContent);
    }
    viewportMetaModified = false;
    originalViewportContent = null;
  }
}
