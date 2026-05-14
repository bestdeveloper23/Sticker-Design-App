import db from "./db.server";
import { getDefaultStickerAppSettings } from "./sticker-settings.defaults";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge partial saved JSON with defaults so new keys appear after upgrades.
 */
export function mergeStickerSettings(saved) {
  const base = getDefaultStickerAppSettings();
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    sizes: { ...base.sizes, ...(saved.sizes || {}) },
    pricing: {
      ...base.pricing,
      ...(saved.pricing || {}),
      tiers: Array.isArray(saved.pricing?.tiers)
        ? saved.pricing.tiers
        : base.pricing.tiers,
      quantityOptions: Array.isArray(saved.pricing?.quantityOptions)
        ? saved.pricing.quantityOptions
        : base.pricing.quantityOptions,
    },
    finish: {
      matte: { ...base.finish.matte, ...(saved.finish?.matte || {}) },
      glossy: { ...base.finish.glossy, ...(saved.finish?.glossy || {}) },
    },
    lamination: {
      none: { ...base.lamination.none, ...(saved.lamination?.none || {}) },
      gloss: { ...base.lamination.gloss, ...(saved.lamination?.gloss || {}) },
      matte: { ...base.lamination.matte, ...(saved.lamination?.matte || {}) },
    },
    defaults: { ...base.defaults, ...(saved.defaults || {}) },
  };
}

function sortTiersDescending(tiers) {
  return [...tiers].sort((a, b) => (b.qtyMin || 0) - (a.qtyMin || 0));
}

function isPositiveNumber(n) {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, settings: ReturnType<typeof mergeStickerSettings> } | { ok: false, error: string }}
 */
export function validateStickerSettings(raw) {
  const s = mergeStickerSettings(raw);

  if (!isPositiveNumber(s.sizes.minWidth) || !isPositiveNumber(s.sizes.minHeight)) {
    return { ok: false, error: "Minimum width and height must be positive numbers." };
  }
  if (!isPositiveNumber(s.sizes.maxWidth) || !isPositiveNumber(s.sizes.maxHeight)) {
    return { ok: false, error: "Maximum width and height must be positive numbers." };
  }
  if (s.sizes.minWidth > s.sizes.maxWidth || s.sizes.minHeight > s.sizes.maxHeight) {
    return { ok: false, error: "Minimum size cannot exceed maximum size." };
  }

  if (!s.sizes.enableCustomSize) {
    const presets = Array.isArray(s.sizes.presets) ? s.sizes.presets : [];
    if (presets.length === 0) {
      return {
        ok: false,
        error: "When custom sizes are disabled, add at least one preset size.",
      };
    }
  }

  if (!Array.isArray(s.pricing.tiers) || s.pricing.tiers.length === 0) {
    return { ok: false, error: "At least one pricing tier is required." };
  }
  for (const t of s.pricing.tiers) {
    if (!Number.isFinite(t.qtyMin) || t.qtyMin < 1) {
      return { ok: false, error: "Each tier needs a valid quantity minimum (qtyMin ≥ 1)." };
    }
    if (!Number.isFinite(t.base) || !Number.isFinite(t.rate) || !Number.isFinite(t.minPer)) {
      return { ok: false, error: "Each tier needs numeric base, rate, and minPer." };
    }
  }
  s.pricing.tiers = sortTiersDescending(s.pricing.tiers);

  if (!Array.isArray(s.pricing.quantityOptions) || s.pricing.quantityOptions.length === 0) {
    return { ok: false, error: "Quantity options must be a non-empty list of numbers." };
  }
  const qtys = s.pricing.quantityOptions.map((q) => Number(q));
  if (qtys.some((q) => !Number.isFinite(q) || q < 1)) {
    return { ok: false, error: "All quantity options must be integers ≥ 1." };
  }
  s.pricing.quantityOptions = [...new Set(qtys.map((q) => Math.round(q)))].sort((a, b) => a - b);

  const mop = Number(s.pricing.minOrderPrice);
  const fee = Number(s.pricing.extraFeeFlat);
  s.pricing.minOrderPrice = Number.isFinite(mop) && mop >= 0 ? mop : 0;
  s.pricing.extraFeeFlat = Number.isFinite(fee) && fee >= 0 ? fee : 0;

  const cc = String(s.currencyCode || "USD")
    .trim()
    .toUpperCase();
  s.currencyCode = /^[A-Z]{3}$/.test(cc) ? cc : "USD";

  const fin = ["matte", "glossy"];
  if (!fin.includes(s.defaults.finish)) s.defaults.finish = "glossy";
  const lam = ["none", "gloss", "matte"];
  if (!lam.includes(s.defaults.lamination)) s.defaults.lamination = "none";

  const dq = Math.round(Number(s.defaults.quantity));
  s.defaults.quantity = Number.isFinite(dq) && dq > 0 ? dq : 50;
  const dw = Number(s.defaults.widthIn);
  const dh = Number(s.defaults.heightIn);
  s.defaults.widthIn = Number.isFinite(dw) && dw > 0 ? dw : 2;
  s.defaults.heightIn = Number.isFinite(dh) && dh > 0 ? dh : 2;

  for (const key of fin) {
    s.finish[key].enabled = Boolean(s.finish[key].enabled);
    const adj = Number(s.finish[key].adjustment);
    s.finish[key].adjustment = Number.isFinite(adj) ? adj : 0;
  }
  for (const key of lam) {
    s.lamination[key].enabled = Boolean(s.lamination[key].enabled);
    const adj = Number(s.lamination[key].adjustment);
    s.lamination[key].adjustment = Number.isFinite(adj) ? adj : 0;
  }

  if (!fin.some((k) => s.finish[k].enabled)) {
    return { ok: false, error: "At least one finish option must be enabled." };
  }
  if (!lam.some((k) => s.lamination[k].enabled)) {
    return { ok: false, error: "At least one lamination option must be enabled." };
  }

  if (!s.finish[s.defaults.finish]?.enabled) {
    const first = fin.find((k) => s.finish[k].enabled);
    s.defaults.finish = first || "glossy";
  }
  if (!s.lamination[s.defaults.lamination]?.enabled) {
    const first = lam.find((k) => s.lamination[k].enabled);
    s.defaults.lamination = first || "none";
  }

  if (!Array.isArray(s.sizes.presets)) {
    s.sizes.presets = getDefaultStickerAppSettings().sizes.presets;
  } else {
    s.sizes.presets = s.sizes.presets
      .map((p) => ({
        label: String(p.label || "").trim() || `${p.width}×${p.height}`,
        width: Number(p.width),
        height: Number(p.height),
      }))
      .filter((p) => Number.isFinite(p.width) && Number.isFinite(p.height) && p.width > 0 && p.height > 0);
  }

  s.sizes.enableCustomSize = Boolean(s.sizes.enableCustomSize);

  return { ok: true, settings: s };
}

export async function getOrCreateShopStickerSettings(shop) {
  let row = await db.shopStickerSettings.findUnique({ where: { shop } });
  if (!row) {
    const defaults = deepClone(getDefaultStickerAppSettings());
    row = await db.shopStickerSettings.create({
      data: { shop, settings: defaults },
    });
  }
  return mergeStickerSettings(row.settings);
}

export async function saveShopStickerSettings(shop, settings) {
  const validated = validateStickerSettings(settings);
  if (!validated.ok) return validated;
  await db.shopStickerSettings.upsert({
    where: { shop },
    create: { shop, settings: validated.settings },
    update: { settings: validated.settings },
  });
  return { ok: true, settings: validated.settings };
}

export async function deleteShopStickerSettings(shop) {
  await db.shopStickerSettings.deleteMany({ where: { shop } });
}
