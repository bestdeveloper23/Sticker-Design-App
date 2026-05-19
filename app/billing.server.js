/**
 * Billing: free trial (10 sticker orders) then 1.5% commission on order total.
 * NOTE: Managed Pricing mode — Shopify handles subscription billing automatically.
 * Billing API (appSubscriptionCreate) is disabled; only usage tracking remains.
 */

import db from "./db.server";

const FREE_TRIAL_STICKER_ORDERS = 10;
const COMMISSION_RATE = 0.015; // 1.5%

const STICKER_PROP_KEYS = ["_Design_URL", "Design_URL"];

function isStickerOrder(order) {
  if (!order?.line_items?.length) return false;
  for (const line of order.line_items) {
    const attrs = line.properties || line.custom_attributes || [];
    for (const attr of attrs) {
      const name = (attr.name || attr.key || "").trim();
      if (STICKER_PROP_KEYS.includes(name) && (attr.value || "").trim())
        return true;
    }
  }
  return false;
}

function getOrderTotal(order) {
  const total =
    (order.total_price || order.total_price_set?.shop_money?.amount) ?? 0;
  return typeof total === "string" ? parseFloat(total) || 0 : Number(total) || 0;
}

function getOrderCurrency(order) {
  return (
    order.currency ||
    order.total_price_set?.shop_money?.currency_code ||
    "USD"
  );
}

async function getOrCreateShopBilling(shop) {
  let row = await db.shopBilling.findUnique({ where: { shop } });
  if (!row) {
    row = await db.shopBilling.create({
      data: { shop, stickerOrderCount: 0 },
    });
  }
  return row;
}

/**
 * Managed pricing: subscription is handled in the Partner Dashboard, not via Billing API here.
 * Ensures a `ShopBilling` row exists for sticker-order counting / logging.
 */
export async function ensureBillingSubscription(shop) {
  await db.shopBilling.upsert({
    where: { shop },
    create: { shop, stickerOrderCount: 0 },
    update: {},
  });
}

/**
 * Record a sticker order and track usage count.
 * Commission charging is handled by Shopify Managed Pricing automatically.
 */
export async function recordStickerOrderAndCharge(_admin, shop, order) {
  if (!order?.id || !isStickerOrder(order)) return;

  const billing = await getOrCreateShopBilling(shop);
  const newCount = (billing.stickerOrderCount ?? 0) + 1;

  await db.shopBilling.update({
    where: { shop },
    data: { stickerOrderCount: newCount },
  });

  // Free trial tracking only — Managed Pricing handles actual charges
  if (newCount <= FREE_TRIAL_STICKER_ORDERS) {
    console.log(`[billing] Shop ${shop}: sticker order ${newCount}/${FREE_TRIAL_STICKER_ORDERS} (free trial)`);
    return;
  }

  const total = getOrderTotal(order);
  const currency = getOrderCurrency(order);
  const amount = Math.round(total * COMMISSION_RATE * 100) / 100;

  // Log for records — actual charge via Managed Pricing
  console.log(`[billing] Shop ${shop}: order #${order.name || order.id}, amount: ${amount} ${currency} (1.5% commission — Managed Pricing)`);
}
