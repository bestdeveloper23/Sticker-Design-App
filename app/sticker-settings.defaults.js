/**
 * Default sticker app configuration (matches legacy hardcoded pricing).
 * Cloned into DB per shop on first read.
 */

export const LEGACY_PRICING_TIERS = [
  { qtyMin: 1000, base: 0.06, rate: 0.0092, minPer: 0.1 },
  { qtyMin: 500, base: 0.09, rate: 0.0086, minPer: 0.12 },
  { qtyMin: 300, base: 0.11, rate: 0.0074, minPer: 0.15 },
  { qtyMin: 200, base: 0.12, rate: 0.01, minPer: 0.175 },
  { qtyMin: 100, base: 0.15, rate: 0.018, minPer: 0.26 },
  { qtyMin: 50, base: 0.23, rate: 0.028, minPer: 0.38 },
  { qtyMin: 25, base: 0.52, rate: 0.027, minPer: 0.6 },
];

export const LEGACY_QUANTITY_OPTIONS = [
  25, 50, 100, 150, 200, 250, 300, 350, 500, 750, 1000,
];

/** @returns {Record<string, unknown>} */
export function getDefaultStickerAppSettings() {
  return {
    version: 1,
    sizes: {
      minWidth: 0.5,
      minHeight: 0.5,
      maxWidth: 24,
      maxHeight: 24,
      enableCustomSize: true,
      presets: [
        { label: "2×2 in", width: 2, height: 2 },
        { label: "3×3 in", width: 3, height: 3 },
        { label: "4×4 in", width: 4, height: 4 },
      ],
    },
    pricing: {
      tiers: LEGACY_PRICING_TIERS.map((t) => ({ ...t })),
      quantityOptions: [...LEGACY_QUANTITY_OPTIONS],
      minOrderPrice: 0,
      extraFeeFlat: 0,
    },
    finish: {
      matte: { enabled: true, adjustment: 0 },
      glossy: { enabled: true, adjustment: 0 },
    },
    lamination: {
      none: { enabled: true, adjustment: 0 },
      gloss: { enabled: true, adjustment: 0 },
      matte: { enabled: true, adjustment: 0 },
    },
    defaults: {
      finish: "glossy",
      lamination: "none",
      quantity: 50,
      widthIn: 2,
      heightIn: 2,
    },
    currencyCode: "USD",
  };
}
