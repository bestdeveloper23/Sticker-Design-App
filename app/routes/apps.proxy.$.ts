import { authenticate } from "../shopify.server";
import { computeStickerLineTotal } from "../pricing.server";
import { getOrCreateShopStickerSettings } from "../sticker-settings.server";
import {
  DEFAULT_DESIGNER_ORIGIN,
  corsHeadersForAllowedDesigner,
  isAllowedDesignerOrigin,
} from "../cors-designer.server";

type AppProxyAuth = {
  admin?: unknown;
  session?: { shop?: string | null } | null;
};

/** Strip trailing slashes so `/settings` and `/settings/` match the same handler. */
function normalizeProxyPathname(pathname: string): string {
  const p = pathname.replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

function resolveShopFromAppProxy(proxyAuth: AppProxyAuth, request: Request): string | null {
  const s = proxyAuth.session?.shop;
  if (s && typeof s === "string") return s;
  const url = new URL(request.url);
  const q = url.searchParams.get("shop");
  if (q) return q;
  return request.headers.get("X-Shopify-Shop-Domain");
}

export const action = async ({ request }) => {
  const url = new URL(request.url);
  const proxyPath = normalizeProxyPathname(url.pathname || "");
  if (request.method !== "POST" || !proxyPath.endsWith("create-draft")) {
    return Response.json({ error: "Method or path not allowed" }, { status: 400 });
  }

  let admin: { graphql: (q: string, opts?: unknown) => Promise<Response> };
  let proxyAuth: AppProxyAuth;
  try {
    proxyAuth = (await authenticate.public.appProxy(request)) as AppProxyAuth;
    admin = proxyAuth.admin as typeof admin;
  } catch (err) {
    console.error("[apps.proxy] App proxy auth failed:", err);
    return Response.json(
      { error: "App proxy authentication failed. Check app installation and API credentials." },
      { status: 401 }
    );
  }

  if (!admin) {
    console.error("[apps.proxy] No admin client — shop may not have an offline session");
    return Response.json(
      { error: "Store session not available. Ensure the app is installed." },
      { status: 503 }
    );
  }

  const shop = resolveShopFromAppProxy(proxyAuth, request);
  if (!shop) {
    return Response.json({ error: "Could not resolve shop for pricing." }, { status: 503 });
  }

  let body: {
    variantId?: string;
    quantity?: number;
    stickerSize?: number;
    quantityOption?: number;
    widthIn?: number;
    heightIn?: number;
    finish?: string;
    lamination?: string;
    properties?: Record<string, string>;
    designUrl?: string;
    rawImageUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const variantId = body.variantId;
  const quantity = body.quantity ?? 1;
  const stickerSize = body.stickerSize ?? 2;
  const quantityOption = body.quantityOption ?? 50;
  const widthIn = body.widthIn;
  const heightIn = body.heightIn;
  if (!variantId) {
    return Response.json({ error: "variantId is required" }, { status: 400 });
  }

  const settings = await getOrCreateShopStickerSettings(shop);
  const priced = computeStickerLineTotal({
    widthIn,
    heightIn,
    stickerSize,
    quantity: quantityOption,
    finish: body.finish,
    lamination: body.lamination,
    settings,
  });

  if (!priced.ok) {
    return Response.json({ error: priced.error }, { status: 400 });
  }

  const price = priced.total;
  const currencyCode = priced.currencyCode || "USD";

  const attrMap = new Map<string, string>();
  if (body.properties) {
    for (const [k, v] of Object.entries(body.properties)) {
      if (v != null && v !== "") attrMap.set(k, String(v));
    }
  }
  attrMap.set("Finish", priced.finish);
  attrMap.set("Lamination", priced.lamination);
  attrMap.set("Calculated_Price", String(price));
  attrMap.set("Pricing_Quantity", String(priced.quantityUsed));
  attrMap.set("Pricing_Width_In", String(priced.widthIn));
  attrMap.set("Pricing_Height_In", String(priced.heightIn));

  const customAttributes = [...attrMap.entries()].map(([key, value]) => ({ key, value }));

  const variantGid =
    variantId.startsWith("gid://") ? variantId : `gid://shopify/ProductVariant/${variantId}`;

  const lineItems: {
    variantId: string;
    quantity: number;
    customAttributes?: { key: string; value: string }[];
    priceOverride?: { amount: string; currencyCode: string };
  }[] = [
    {
      variantId: variantGid,
      quantity: Math.max(1, quantity),
      priceOverride: { amount: String(price), currencyCode },
      customAttributes,
    },
  ];

  let result: {
    data?: {
      draftOrderCreate?: {
        draftOrder?: { invoiceUrl?: string };
        userErrors?: { message: string }[];
      };
    };
    errors?: { message: string }[];
  };
  try {
    const response = await admin.graphql(
      `#graphql
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          message
          field
        }
      }
    }`,
      {
        variables: {
          input: {
            lineItems,
          },
        },
      }
    );
    result = await response.json();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[apps.proxy] GraphQL draftOrderCreate failed:", msg);
    if (/protected.customer.data|not approved to access the DraftOrder/i.test(msg)) {
      return Response.json(
        {
          error:
            "Draft orders are blocked until this app is approved for protected customer data in the Shopify Partner Dashboard. See https://shopify.dev/docs/apps/launch/protected-customer-data",
          code: "PROTECTED_CUSTOMER_DATA",
        },
        { status: 403 }
      );
    }
    if (/scope|permission|access/i.test(msg)) {
      return Response.json(
        {
          error:
            "This app needs permission to create draft orders. Uninstall the app and reinstall it from your Shopify admin, then try again.",
        },
        { status: 403 }
      );
    }
    return Response.json({ error: "Failed to create draft order." }, { status: 500 });
  }

  const graphqlErrors = result?.errors || [];
  const pcdError = graphqlErrors.find((e: { message: string }) =>
    /protected.customer.data|DraftOrder/i.test(e?.message || "")
  );
  if (pcdError) {
    return Response.json(
      {
        error:
          "Draft orders are blocked until this app is approved for protected customer data. See https://shopify.dev/docs/apps/launch/protected-customer-data",
        code: "PROTECTED_CUSTOMER_DATA",
      },
      { status: 403 }
    );
  }
  const scopeError = graphqlErrors.find(
    (e: { message: string }) => /scope|permission|access/i.test(e?.message || "")
  );
  if (scopeError) {
    return Response.json(
      {
        error:
          "This app needs permission to create draft orders. Uninstall the app and reinstall it from your Shopify admin, then try again.",
      },
      { status: 403 }
    );
  }

  const data = result?.data?.draftOrderCreate;
  const userErrors = data?.userErrors || [];
  if (userErrors.length > 0) {
    return Response.json(
      { error: userErrors.map((e: { message: string }) => e.message).join(", ") },
      { status: 400 }
    );
  }

  const invoiceUrl = data?.draftOrder?.invoiceUrl;
  if (!invoiceUrl) {
    return Response.json({ error: "Draft order created but no invoice URL" }, { status: 500 });
  }

  return Response.json({ checkoutUrl: invoiceUrl });
};

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const pathname = normalizeProxyPathname(url.pathname || "");

  if (request.method === "OPTIONS" && pathname.endsWith("/settings")) {
    const cors = corsHeadersForAllowedDesigner(request);
    if (!cors) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { status: 204, headers: cors });
  }

  let proxyAuth: AppProxyAuth;
  try {
    proxyAuth = (await authenticate.public.appProxy(request)) as AppProxyAuth;
  } catch (err) {
    console.error("[apps.proxy] App proxy auth failed (loader):", err);
    return Response.json(
      { error: "App proxy authentication failed.", designs: [] },
      { status: 401 }
    );
  }

  const shop = resolveShopFromAppProxy(proxyAuth, request);

  if (request.method === "GET" && pathname.endsWith("/settings")) {
    if (!shop) {
      return Response.json({ error: "Shop not resolved" }, { status: 401 });
    }
    try {
      const settings = await getOrCreateShopStickerSettings(shop);
      const cors = corsHeadersForAllowedDesigner(request);
      const headers: Record<string, string> = {
        "Cache-Control": "private, max-age=120",
        ...(cors || {}),
      };
      return Response.json(settings, { headers });
    } catch (e) {
      console.error("[apps.proxy] settings load failed:", e);
      return Response.json({ error: "Could not load settings" }, { status: 500 });
    }
  }

  if (request.method === "GET" && pathname.endsWith("/designs")) {
    const customerId = url.searchParams.get("customerId") ?? "";
    const designerOriginParam = url.searchParams.get("designerOrigin");
    const designerOrigin = isAllowedDesignerOrigin(designerOriginParam)
      ? new URL(designerOriginParam!).origin
      : new URL(DEFAULT_DESIGNER_ORIGIN).origin;

    const designsUrl = `${designerOrigin}/api/designs?customerId=${encodeURIComponent(customerId)}`;
    try {
      const res = await fetch(designsUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      return Response.json(data, {
        status: res.status,
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch (err) {
      return Response.json(
        { error: "Could not load designs", designs: [] },
        { status: 502 }
      );
    }
  }

  return Response.json({ ok: true, message: "Use POST to create-draft or GET .../settings" });
};
