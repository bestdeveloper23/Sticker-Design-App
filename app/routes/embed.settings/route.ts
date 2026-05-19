/**
 * Public embed settings for the Replit designer (iframe).
 * Path: GET /embed/settings?shop=STORE.myshopify.com
 * (Folder route so React Router reliably registers the URL on Vercel.)
 */
import type { LoaderFunctionArgs } from "react-router";
import { getOrCreateShopStickerSettings } from "../../sticker-settings.server";
import {
  corsHeadersForAllowedDesigner,
  isValidEmbedShopParam,
} from "../../cors-designer.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
    console.error("[embed.settings] load failed:", e);
    return Response.json(
      { error: "Could not load settings" },
      { status: 500, headers: cors || {} },
    );
  }
};

/** Required for route module; loader returns JSON for data requests. */
export default function EmbedSettingsStub() {
  return null;
}
