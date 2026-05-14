import { authenticate, adminGraphqlClient } from "../shopify.server";
import { recordStickerOrderAndCharge } from "../billing.server";

export const action = async ({ request }) => {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const { shop, session, topic } = await authenticate.webhook(request);
  if (!shop) return new Response(null, { status: 401 });

  let order;
  try {
    order = await request.json();
  } catch {
    return new Response(null, { status: 200 });
  }

  const admin = session ? adminGraphqlClient(session) : null;
  if (admin) {
    try {
      await recordStickerOrderAndCharge(admin, shop, order);
    } catch (err) {
      console.error(`[webhooks.orders.paid] ${topic} for ${shop}:`, err);
    }
  }

  return new Response(null, { status: 200 });
};
