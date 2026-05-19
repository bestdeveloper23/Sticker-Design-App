/**
 * Public embed settings for the Replit designer (iframe).
 * Served from the app host (e.g. Vercel) with CORS — not via storefront app proxy,
 * because Shopify often does not forward Access-Control-* on proxy responses.
 */
import { getOrCreateShopStickerSettings } from "../sticker-settings.server";
import {
  corsHeadersForAllowedDesigner,
  isValidEmbedShopParam,
} from "../cors-designer.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const cors = corsHeadersForAllowedDesigner(request);

  if (request.method === "OPTIONS") {
    if (!cors) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const shop = url.searchParams.get("shop")?.trim() ?? "";
  if (!isValidEmbedShopParam(shop)) {
    return Response.json(
      { error: "Invalid or missing shop parameter" },
      { status: 400, headers: cors || {} },
    );
  }

  try {
    const settings = await getOrCreateShopStickerSettings(shop);
    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=120",
      ...(cors || {}),
    };
    return Response.json(settings, { headers });
  } catch (e) {
    console.error("[api.embed.settings] load failed:", e);
    return Response.json(
      { error: "Could not load settings" },
      { status: 500, headers: cors || {} },
    );
  }
};
