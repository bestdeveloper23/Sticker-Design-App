/** Default designer origin; also used when no custom origin is allowed. */
export const DEFAULT_DESIGNER_ORIGIN =
  process.env.DESIGNER_ORIGIN || "https://stickeroutline.replit.app";

/** Allowed designer origins for embed CORS (avoid SSRF). Comma-separated in env. */
export function getAllowedDesignerOrigins() {
  const list = [
    DEFAULT_DESIGNER_ORIGIN,
    ...(process.env.ALLOWED_DESIGNER_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  return [...new Set(list)];
}

/** Strict allowlist only — use for server-side fetches (e.g. app proxy) to avoid SSRF. */
export function isAllowedDesignerOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    const normalized = u.origin;
    for (const a of getAllowedDesignerOrigins()) {
      try {
        if (new URL(a).origin === normalized) return true;
      } catch {
        /* skip invalid env entry */
      }
    }
    return false;
  } catch {
    return false;
  }
}

/** HTTPS host is Replit-hosted (browser CORS only; do not use for outbound SSRF checks). */
function isReplitHttpsDesignerOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    return h === "replit.app" || h.endsWith(".replit.app") || h.endsWith(".replit.dev");
  } catch {
    return false;
  }
}

/**
 * Origins that may receive CORS on GET /embed/settings (and proxy /settings).
 * - Always: explicit allowlist (DESIGNER_ORIGIN + ALLOWED_DESIGNER_ORIGINS).
 * - Unless DESIGNER_CORS_STRICT=1: any https *.replit.app / *.replit.dev (preview URLs).
 */
function isBrowserCorsAllowedDesignerOrigin(origin) {
  if (isAllowedDesignerOrigin(origin)) return true;
  const strict =
    process.env.DESIGNER_CORS_STRICT === "1" ||
    process.env.DESIGNER_CORS_STRICT === "true";
  if (strict) return false;
  return isReplitHttpsDesignerOrigin(origin);
}

/** CORS headers when the browser Origin is allowed for the designer iframe. */
export function corsHeadersForAllowedDesigner(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !isBrowserCorsAllowedDesignerOrigin(origin)) return null;

  const reqHdr = request.headers.get("Access-Control-Request-Headers");
  const allowHeaders =
    reqHdr && /^[\w\-\s,]+$/i.test(reqHdr.trim())
      ? reqHdr.trim()
      : "Content-Type, Accept";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    Vary: "Origin",
  };
}

/** @param {string | null | undefined} shop */
export function isValidEmbedShopParam(shop) {
  if (!shop || typeof shop !== "string") return false;
  const s = shop.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s);
}
