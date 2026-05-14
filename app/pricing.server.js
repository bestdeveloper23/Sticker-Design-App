/**
 * Sticker pricing: tiered by quantity and area. Values usually come from per-shop settings.
 */

import {
  LEGACY_PRICING_TIERS,
  LEGACY_QUANTITY_OPTIONS,
} from "./sticker-settings.defaults";

function roundCents(x) {
  return Math.round(x * 100) / 100;
}

function normalizeTiers(tiers) {
  if (!Array.isArray(tiers) || tiers.length === 0) return [...LEGACY_PRICING_TIERS];
  return [...tiers].sort((a, b) => (b.qtyMin || 0) - (a.qtyMin || 0));
}

function pickTier(qty, tiers) {
  const t = normalizeTiers(tiers);
  return t.find((row) => qty >= row.qtyMin) || t[t.length - 1];
}

/**
 * @param {number} qty
 * @param {number[]|undefined} quantityOptions
 */
export function snapQuantityToOptions(qty, quantityOptions) {
  const list =
    Array.isArray(quantityOptions) && quantityOptions.length > 0
      ? quantityOptions.map((q) => Math.round(Number(q))).filter((q) => q >= 1)
      : [...LEGACY_QUANTITY_OPTIONS];
  const q = Math.max(1, Math.round(Number(qty) || list[0]));
  return list.reduce((prev, curr) =>
    Math.abs(curr - q) < Math.abs(prev - q) ? curr : prev
  );
}

/**
 * Calculate sticker price from dimensions (inches) and quantity.
 * @param {number} widthIn
 * @param {number} heightIn
 * @param {number} qty
 * @param {{ tiers?: Array<{ qtyMin: number; base: number; rate: number; minPer: number }> }} [opts]
 */
export function calcStickerPrice(widthIn, heightIn, qty, opts = {}) {
  widthIn = Number(widthIn);
  heightIn = Number(heightIn);
  qty = Math.max(1, Math.round(qty));

  if (
    !Number.isFinite(widthIn) ||
    !Number.isFinite(heightIn) ||
    widthIn <= 0 ||
    heightIn <= 0
  ) {
    return { perSticker: 0, total: 0, area: 0, tierUsed: 0 };
  }

  const area = widthIn * heightIn;
  const tier = pickTier(qty, opts.tiers);

  const perStickerRaw = tier.base + tier.rate * area;
  const perSticker = Math.max(tier.minPer, perStickerRaw);

  const total = roundCents(perSticker * qty);

  return {
    area: roundCents(area),
    perSticker: roundCents(perSticker),
    total,
    tierUsed: tier.qtyMin,
  };
}

/**
 * @deprecated Use snapQuantityToOptions
 */
export function getClosestQuantity(qty) {
  return snapQuantityToOptions(qty, LEGACY_QUANTITY_OPTIONS);
}

/**
 * Back-compat: same as old calculateDraftOrderPrice using legacy tiers only.
 */
export function calculateDraftOrderPrice(widthIn, heightIn, stickerSize, quantity) {
  const w = Number(widthIn);
  const h = Number(heightIn);
  const size = Number(stickerSize) || 2;
  const qty = Math.max(1, Math.round(Number(quantity) || 50));

  const width = Number.isFinite(w) && w > 0 ? w : size;
  const height = Number.isFinite(h) && h > 0 ? h : size;

  const { total } = calcStickerPrice(width, height, qty, { tiers: LEGACY_PRICING_TIERS });
  return total;
}

/**
 * Full line total for a shop: base formula + finish + lamination + extra fee + min order floor.
 * @param {object} input
 * @param {object} input.settings merged shop settings from DB
 */
export function computeStickerLineTotal(input) {
  const s = input.settings;
  if (!s?.pricing?.tiers) {
    return { ok: false, error: "Missing shop pricing settings." };
  }

  const qty = snapQuantityToOptions(
    input.quantity,
    s.pricing.quantityOptions
  );

  const wIn = Number(input.widthIn);
  const hIn = Number(input.heightIn);
  const size = Number(input.stickerSize) || 2;
  const width =
    Number.isFinite(wIn) && wIn > 0 ? wIn : Number.isFinite(size) && size > 0 ? size : 2;
  const height =
    Number.isFinite(hIn) && hIn > 0 ? hIn : Number.isFinite(size) && size > 0 ? size : 2;

  if (width < s.sizes.minWidth || height < s.sizes.minHeight) {
    return {
      ok: false,
      error: `Size must be at least ${s.sizes.minWidth}" × ${s.sizes.minHeight}".`,
    };
  }
  if (width > s.sizes.maxWidth || height > s.sizes.maxHeight) {
    return {
      ok: false,
      error: `Size cannot exceed ${s.sizes.maxWidth}" × ${s.sizes.maxHeight}".`,
    };
  }

  if (!s.sizes.enableCustomSize) {
    const presets = Array.isArray(s.sizes.presets) ? s.sizes.presets : [];
    const match = presets.some(
      (p) =>
        Math.abs(Number(p.width) - width) < 0.001 &&
        Math.abs(Number(p.height) - height) < 0.001
    );
    if (!match) {
      return {
        ok: false,
        error: "Custom sizes are disabled. Choose a preset size.",
      };
    }
  }

  const finishKey = String(input.finish || s.defaults?.finish || "glossy")
    .toLowerCase()
    .trim();
  const lamKey = String(input.lamination || s.defaults?.lamination || "none")
    .toLowerCase()
    .trim();

  if (!s.finish?.[finishKey]?.enabled) {
    return { ok: false, error: "Selected finish is not available." };
  }
  if (!s.lamination?.[lamKey]?.enabled) {
    return { ok: false, error: "Selected lamination is not available." };
  }

  const base = calcStickerPrice(width, height, qty, { tiers: s.pricing.tiers });
  const finishAdj = Number(s.finish[finishKey].adjustment) || 0;
  const lamAdj = Number(s.lamination[lamKey].adjustment) || 0;
  const extra = Number(s.pricing.extraFeeFlat) || 0;
  const beforeFloor = roundCents(base.total + finishAdj + lamAdj + extra);
  const minOrder = Number(s.pricing.minOrderPrice) || 0;
  let total = beforeFloor;
  let minOrderApplied = false;
  if (minOrder > 0 && total < minOrder) {
    total = roundCents(minOrder);
    minOrderApplied = true;
  }

  return {
    ok: true,
    total,
    perSticker: base.perSticker,
    area: base.area,
    tierUsed: base.tierUsed,
    quantityUsed: qty,
    widthIn: width,
    heightIn: height,
    finish: finishKey,
    lamination: lamKey,
    currencyCode: s.currencyCode || "USD",
    breakdown: {
      baseTotal: base.total,
      finishAdjustment: finishAdj,
      laminationAdjustment: lamAdj,
      extraFeeFlat: extra,
      minOrderApplied,
    },
  };
}
