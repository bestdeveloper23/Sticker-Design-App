import { useEffect, useState } from "react";
<<<<<<< HEAD
import {
  useFetcher,
  useLoaderData,
  redirect,
} from "react-router";
=======
import { useFetcher, useLoaderData } from "react-router";
>>>>>>> 2a982d2 (merged)
import { authenticate } from "../shopify.server";
import { ensureBillingSubscription } from "../billing.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getDefaultStickerAppSettings } from "../sticker-settings.defaults";
import {
  getOrCreateShopStickerSettings,
  saveShopStickerSettings,
} from "../sticker-settings.server";

<<<<<<< HEAD
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const returnUrl = `${url.origin}${url.pathname}`;
  const billing = await ensureBillingSubscription(admin, shop, returnUrl);
  if (!billing.hasSubscription && billing.confirmationUrl) {
    return redirect(billing.confirmationUrl);
  }
  if (!billing.hasSubscription && !billing.confirmationUrl) {
    return { billingSetupFailed: true, settings: getDefaultStickerAppSettings() };
  }
  const settings = await getOrCreateShopStickerSettings(shop);
  return { billingSetupFailed: false, settings };
=======
export const config = { runtime: "nodejs" };

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  await ensureBillingSubscription(shop);
  const settings = await getOrCreateShopStickerSettings(shop);
  return { settings };
>>>>>>> 2a982d2 (merged)
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const raw = formData.get("settings");
  if (raw == null || String(raw).trim() === "") {
    return { ok: false, error: "Missing settings payload." };
  }
  let parsed;
  try {
    parsed = JSON.parse(String(raw));
  } catch {
    return { ok: false, error: "Invalid JSON in settings." };
  }
  const result = await saveShopStickerSettings(shop, parsed);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, settings: result.settings };
};

const box = {
  border: "1px solid #e8eaed",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
  background: "#fff",
};

const label = { display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px", color: "#374151" };
const input = {
  width: "100%",
  maxWidth: "200px",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #c9cccf",
  fontSize: "14px",
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function StickerSettingsPage() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const [settings, setSettings] = useState(() => deepClone(loaderData.settings));

  useEffect(() => {
    if (fetcher.data?.ok === true && fetcher.data.settings) {
      setSettings(deepClone(fetcher.data.settings));
    }
  }, [fetcher.data]);

  const err =
    fetcher.data && "error" in fetcher.data ? fetcher.data.error : null;

  const updateSizes = (patch) => {
    setSettings((s) => ({ ...s, sizes: { ...s.sizes, ...patch } }));
  };
  const updatePricing = (patch) => {
    setSettings((s) => ({ ...s, pricing: { ...s.pricing, ...patch } }));
  };
  const updateDefaults = (patch) => {
    setSettings((s) => ({ ...s, defaults: { ...s.defaults, ...patch } }));
  };

  const setTier = (index, field, value) => {
    setSettings((s) => {
      const tiers = [...s.pricing.tiers];
      tiers[index] = { ...tiers[index], [field]: value === "" ? 0 : Number(value) };
      return { ...s, pricing: { ...s.pricing, tiers } };
    });
  };

  const setPreset = (index, field, value) => {
    setSettings((s) => {
      const presets = [...(s.sizes.presets || [])];
      presets[index] = {
        ...presets[index],
        [field]: field === "label" ? value : value === "" ? 0 : Number(value),
      };
      return { ...s, sizes: { ...s.sizes, presets } };
    });
  };

  const addPreset = () => {
    setSettings((s) => ({
      ...s,
      sizes: {
        ...s.sizes,
        presets: [...(s.sizes.presets || []), { label: "New", width: 2, height: 2 }],
      },
    }));
  };

  const removePreset = (index) => {
    setSettings((s) => ({
      ...s,
      sizes: {
        ...s.sizes,
        presets: (s.sizes.presets || []).filter((_, i) => i !== index),
      },
    }));
  };

  const qtyOptionsStr = (settings.pricing.quantityOptions || []).join(", ");

  return (
    <>
      <s-page heading="Sticker builder settings">
        <s-section heading="Per-store configuration">
          <s-paragraph>
            Sizes, pricing tiers, finishes, lamination, and defaults apply only to{" "}
            <strong>this</strong> store. The storefront designer loads these values from the app
            proxy; checkout prices are always recalculated on the server.
          </s-paragraph>
        </s-section>

<<<<<<< HEAD
        {loaderData.billingSetupFailed && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#991b1b",
            }}
          >
            Billing could not be verified. Settings shown are defaults; save may still work after
            billing is fixed.
          </div>
        )}

=======
>>>>>>> 2a982d2 (merged)
        {err && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#991b1b",
            }}
          >
            {err}
          </div>
        )}

        {fetcher.data?.ok === true && (
          <div
            role="status"
            style={{
              background: "#f0fdf4",
              border: "1px solid #86efac",
              borderRadius: "10px",
              padding: "14px 18px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#166534",
            }}
          >
            Settings saved.
          </div>
        )}

        <fetcher.Form
          method="post"
          onSubmit={(e) => {
            const form = e.currentTarget;
            const el = form.elements.namedItem("settings");
            if (el && "value" in el) {
              el.value = JSON.stringify(settings);
            }
          }}
        >
          <input type="hidden" name="settings" defaultValue="{}" />

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Size limits</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px" }}>
              <div>
                <span style={label}>Min width (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  style={input}
                  value={settings.sizes.minWidth}
                  onChange={(e) => updateSizes({ minWidth: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Min height (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  style={input}
                  value={settings.sizes.minHeight}
                  onChange={(e) => updateSizes({ minHeight: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Max width (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  style={input}
                  value={settings.sizes.maxWidth}
                  onChange={(e) => updateSizes({ maxWidth: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Max height (in)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  style={input}
                  value={settings.sizes.maxHeight}
                  onChange={(e) => updateSizes({ maxHeight: Number(e.target.value) })}
                />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={!!settings.sizes.enableCustomSize}
                onChange={(e) => updateSizes({ enableCustomSize: e.target.checked })}
              />
              Allow custom width × height (when off, only preset sizes below are valid)
            </label>
          </div>

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Preset sizes</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: 0 }}>
              Used when custom sizes are disabled, and passed to the designer for quick picks.
            </p>
            {(settings.sizes.presets || []).map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  alignItems: "flex-end",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <span style={label}>Label</span>
                  <input
                    type="text"
                    style={{ ...input, maxWidth: "140px" }}
                    value={p.label}
                    onChange={(e) => setPreset(i, "label", e.target.value)}
                  />
                </div>
                <div>
                  <span style={label}>W</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ ...input, maxWidth: "90px" }}
                    value={p.width}
                    onChange={(e) => setPreset(i, "width", e.target.value)}
                  />
                </div>
                <div>
                  <span style={label}>H</span>
                  <input
                    type="number"
                    step="0.01"
                    style={{ ...input, maxWidth: "90px" }}
                    value={p.height}
                    onChange={(e) => setPreset(i, "height", e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => removePreset(i)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addPreset}>
              Add preset
            </button>
          </div>

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Pricing formula inputs</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", marginTop: 0 }}>
              Per-sticker price uses the same formula as before:{" "}
              <code>max(minPer, base + rate × area)</code> where area is width × height (in²).
              Tiers apply by quantity minimum (<code>qtyMin</code>), highest matching tier wins.
            </p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "13px", width: "100%", maxWidth: "640px" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px" }}>Qty ≥</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Base</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Rate</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Min / sticker</th>
                  </tr>
                </thead>
                <tbody>
                  {(settings.pricing.tiers || []).map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="number"
                          style={{ ...input, maxWidth: "100px" }}
                          value={t.qtyMin}
                          onChange={(e) => setTier(i, "qtyMin", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="number"
                          step="0.0001"
                          style={{ ...input, maxWidth: "100px" }}
                          value={t.base}
                          onChange={(e) => setTier(i, "base", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="number"
                          step="0.0001"
                          style={{ ...input, maxWidth: "100px" }}
                          value={t.rate}
                          onChange={(e) => setTier(i, "rate", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "4px" }}>
                        <input
                          type="number"
                          step="0.0001"
                          style={{ ...input, maxWidth: "100px" }}
                          value={t.minPer}
                          onChange={(e) => setTier(i, "minPer", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "14px" }}>
              <span style={label}>Quantity options (comma-separated)</span>
              <input
                type="text"
                style={{ ...input, maxWidth: "480px" }}
                value={qtyOptionsStr}
                onChange={(e) => {
                  const parts = e.target.value
                    .split(",")
                    .map((x) => Math.round(Number(x.trim())))
                    .filter((n) => n >= 1);
                  updatePricing({ quantityOptions: parts.length ? parts : [50] });
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
              <div>
                <span style={label}>Minimum order price (floor)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  style={input}
                  value={settings.pricing.minOrderPrice}
                  onChange={(e) => updatePricing({ minOrderPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Extra flat fee per line</span>
                <input
                  type="number"
                  step="0.01"
                  style={input}
                  value={settings.pricing.extraFeeFlat}
                  onChange={(e) => updatePricing({ extraFeeFlat: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Draft order currency</span>
                <input
                  type="text"
                  maxLength={3}
                  style={{ ...input, maxWidth: "80px", textTransform: "uppercase" }}
                  value={settings.currencyCode}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, currencyCode: e.target.value.toUpperCase() }))
                  }
                />
              </div>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Finish</h3>
            {["matte", "glossy"].map((key) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <label style={{ minWidth: "100px", textTransform: "capitalize" }}>
                  <input
                    type="checkbox"
                    checked={!!settings.finish[key].enabled}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        finish: {
                          ...s.finish,
                          [key]: { ...s.finish[key], enabled: e.target.checked },
                        },
                      }))
                    }
                  />{" "}
                  {key}
                </label>
                <div>
                  <span style={label}>Price adjustment (added to line total)</span>
                  <input
                    type="number"
                    step="0.01"
                    style={input}
                    value={settings.finish[key].adjustment}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        finish: {
                          ...s.finish,
                          [key]: {
                            ...s.finish[key],
                            adjustment: Number(e.target.value),
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Lamination</h3>
            {["none", "gloss", "matte"].map((key) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <label style={{ minWidth: "120px", textTransform: "capitalize" }}>
                  <input
                    type="checkbox"
                    checked={!!settings.lamination[key].enabled}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        lamination: {
                          ...s.lamination,
                          [key]: { ...s.lamination[key], enabled: e.target.checked },
                        },
                      }))
                    }
                  />{" "}
                  {key === "none" ? "No lamination" : key}
                </label>
                <div>
                  <span style={label}>Price adjustment</span>
                  <input
                    type="number"
                    step="0.01"
                    style={input}
                    value={settings.lamination[key].adjustment}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        lamination: {
                          ...s.lamination,
                          [key]: {
                            ...s.lamination[key],
                            adjustment: Number(e.target.value),
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={box}>
            <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>Default customer selections</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <span style={label}>Default finish</span>
                <select
                  style={input}
                  value={settings.defaults.finish}
                  onChange={(e) => updateDefaults({ finish: e.target.value })}
                >
                  <option value="glossy">Glossy</option>
                  <option value="matte">Matte</option>
                </select>
              </div>
              <div>
                <span style={label}>Default lamination</span>
                <select
                  style={input}
                  value={settings.defaults.lamination}
                  onChange={(e) => updateDefaults({ lamination: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="gloss">Gloss laminate</option>
                  <option value="matte">Matte laminate</option>
                </select>
              </div>
              <div>
                <span style={label}>Default quantity</span>
                <input
                  type="number"
                  min="1"
                  style={input}
                  value={settings.defaults.quantity}
                  onChange={(e) => updateDefaults({ quantity: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Default width (in)</span>
                <input
                  type="number"
                  step="0.01"
                  style={input}
                  value={settings.defaults.widthIn}
                  onChange={(e) => updateDefaults({ widthIn: Number(e.target.value) })}
                />
              </div>
              <div>
                <span style={label}>Default height (in)</span>
                <input
                  type="number"
                  step="0.01"
                  style={input}
                  value={settings.defaults.heightIn}
                  onChange={(e) => updateDefaults({ heightIn: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={fetcher.state !== "idle"}
              style={{
                background: "#1a6fe8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: fetcher.state !== "idle" ? "not-allowed" : "pointer",
                opacity: fetcher.state !== "idle" ? 0.7 : 1,
              }}
            >
              {fetcher.state !== "idle" ? "Saving…" : "Save settings"}
            </button>
            <button
              type="button"
              onClick={() => setSettings(deepClone(getDefaultStickerAppSettings()))}
            >
              Reset to app defaults
            </button>
          </div>
        </fetcher.Form>
      </s-page>
    </>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
