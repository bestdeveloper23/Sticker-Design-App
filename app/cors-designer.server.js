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

export function isAllowedDesignerOrigin(origin) {
  if (!origin || typeof origin !== "string") return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    const allowed = getAllowedDesignerOrigins();
    const normalized = u.origin;
    return allowed.some((a) => new URL(a).origin === normalized);
  } catch {
    return false;
  }
}

/** CORS headers when the browser Origin is an allowed Replit/designer host. */
export function corsHeadersForAllowedDesigner(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !isAllowedDesignerOrigin(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    Vary: "Origin",
  };
}

/** @param {string | null | undefined} shop */
export function isValidEmbedShopParam(shop) {
  if (!shop || typeof shop !== "string") return false;
  const s = shop.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(s);
}
