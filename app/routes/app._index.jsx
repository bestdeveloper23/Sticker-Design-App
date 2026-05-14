import { useFetcher, useLoaderData, redirect } from "react-router";
import { authenticate } from "../shopify.server";
import { ensureBillingSubscription } from "../billing.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }) => {
  const { admin, scopes, session } = await authenticate.admin(request);
  const scopesDetail = await scopes.query();
  const hasDraftOrderScope = scopesDetail.granted.includes("write_draft_orders");

  const shop = session?.shop;
  if (shop) {
    const url = new URL(request.url);
    const returnUrl = `${url.origin}${url.pathname}`;
    const billing = await ensureBillingSubscription(admin, shop, returnUrl);
    if (!billing.hasSubscription && billing.confirmationUrl) {
      return redirect(billing.confirmationUrl);
    }
    if (!billing.hasSubscription && !billing.confirmationUrl) {
      return { needsDraftOrderScope: !hasDraftOrderScope, billingSetupFailed: true };
    }
  }

  return { needsDraftOrderScope: !hasDraftOrderScope };
};

export const action = async ({ request }) => {
  const { scopes } = await authenticate.admin(request);
  const formData = await request.formData();
  if (formData.get("intent") === "request-draft-scope") {
    await scopes.request(["write_draft_orders"]);
    return { draftScopeRequested: true };
  }
  return {};
};

const styles = `
  .csa-dashboard {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 0;
  }

  .csa-hero {
    background: linear-gradient(135deg, #1a6fe8 0%, #0f4fc0 60%, #0a3a9e 100%);
    border-radius: 16px;
    padding: 40px 48px;
    color: white;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .csa-hero-text h1 {
    font-size: 28px;
    font-weight: 800;
    margin: 0 0 8px 0;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }

  .csa-hero-text p {
    font-size: 15px;
    margin: 0;
    opacity: 0.85;
    max-width: 480px;
    line-height: 1.6;
  }

  .csa-hero-badge {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 50px;
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    backdrop-filter: blur(8px);
  }

  .csa-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .csa-stat-card {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(26,111,232,0.06);
  }

  .csa-stat-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .csa-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .csa-stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #1a6fe8;
  }

  .csa-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .csa-card {
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(26,111,232,0.04);
  }

  .csa-card h3 {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .csa-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .csa-step {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .csa-step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #1a6fe8;
    color: white;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .csa-step-text strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }

  .csa-step-text span {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
  }

  .csa-checklist {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .csa-check-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
  }

  .csa-check-dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #dcfce7;
    border: 1.5px solid #16a34a;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 10px;
    margin-top: 1px;
  }

  .csa-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }

  .csa-feature {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
    border: 1px solid #e8eaed;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }

  .csa-feature-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #eff6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .csa-feature-text strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 2px;
  }

  .csa-feature-text span {
    font-size: 12px;
    color: #6b7280;
  }

  .csa-alert {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #991b1b;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .csa-scope-card {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 24px;
  }

  .csa-scope-card h3 {
    font-size: 14px;
    font-weight: 700;
    color: #92400e;
    margin: 0 0 6px 0;
  }

  .csa-scope-card p {
    font-size: 13px;
    color: #78350f;
    margin: 0 0 14px 0;
    line-height: 1.5;
  }

  .csa-btn-primary {
    background: #1a6fe8;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .csa-btn-primary:hover {
    background: #1558c4;
  }
`;

export default function Index() {
  const { needsDraftOrderScope, billingSetupFailed } = useLoaderData() || {};
  const scopeFetcher = useFetcher();

  return (
    <>
      <style>{styles}</style>
      <s-page heading="Custom Sticker App">
        <div className="csa-dashboard">

          {billingSetupFailed && (
            <div className="csa-alert">
              ⚠️ Billing could not be set up. Please refresh the page or go to Settings → Billing to approve the app charge.
            </div>
          )}

          {needsDraftOrderScope && (
            <div className="csa-scope-card">
              <h3>⚡ Action Required: Grant Permission</h3>
              <p>Grant draft order permission to allow customers to order custom sizes and quantities from the sticker designer.</p>
              <scopeFetcher.Form method="post">
                <input type="hidden" name="intent" value="request-draft-scope" />
                <button
                  type="submit"
                  className="csa-btn-primary"
                  disabled={scopeFetcher.state !== "idle"}
                >
                  {scopeFetcher.state !== "idle" ? "Requesting..." : "Grant Draft Order Permission"}
                </button>
              </scopeFetcher.Form>
            </div>
          )}

          {/* HERO */}
          <div className="csa-hero">
            <div className="csa-hero-text">
              <h1>🎨 Custom Sticker App</h1>
              <p>Let your customers design and order fully custom waterproof vinyl stickers — right from your Shopify store. Upload, size, design, done.</p>
            </div>
            <div className="csa-hero-badge">✅ Pro Plan Active</div>
          </div>

          {/* STATS */}
          <div className="csa-stats">
            <div className="csa-stat-card">
              <div className="csa-stat-icon">🎨</div>
              <div className="csa-stat-label">Sticker Designer</div>
              <div className="csa-stat-value">Live</div>
            </div>
            <div className="csa-stat-card">
              <div className="csa-stat-icon">⚡</div>
              <div className="csa-stat-label">Production Time</div>
              <div className="csa-stat-value">24–48hr</div>
            </div>
            <div className="csa-stat-card">
              <div className="csa-stat-icon">💎</div>
              <div className="csa-stat-label">Quality</div>
              <div className="csa-stat-value">Waterproof</div>
            </div>
          </div>

          {/* HOW IT WORKS + SETUP */}
          <div className="csa-grid">
            <div className="csa-card">
              <h3>🚀 How It Works</h3>
              <div className="csa-steps">
                <div className="csa-step">
                  <div className="csa-step-num">1</div>
                  <div className="csa-step-text">
                    <strong>Tag your products</strong>
                    <span>Add the "Sticker Designer" tag to any product to enable the designer on that page.</span>
                  </div>
                </div>
                <div className="csa-step">
                  <div className="csa-step-num">2</div>
                  <div className="csa-step-text">
                    <strong>Customer uploads design</strong>
                    <span>Customers click "Design Now", upload their image and instantly get a cutline preview.</span>
                  </div>
                </div>
                <div className="csa-step">
                  <div className="csa-step-num">3</div>
                  <div className="csa-step-text">
                    <strong>Choose size & quantity</strong>
                    <span>Pick from standard sizes or enter a custom size. Bulk pricing shown automatically.</span>
                  </div>
                </div>
                <div className="csa-step">
                  <div className="csa-step-num">4</div>
                  <div className="csa-step-text">
                    <strong>Order placed</strong>
                    <span>Design reference and sticker specs saved to order automatically.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="csa-card">
              <h3>✅ Quick Setup Checklist</h3>
              <div className="csa-checklist">
                {[
                  "Add the Sticker Designer app block to your product template in the Theme Editor",
                  "Tag your sticker products with Sticker Designer",
                  "Add a Custom Size variant (price $0) for custom size/qty orders",
                  "Add the Cart Sticker Images block to your cart template",
                  "Test by uploading a PNG or JPG design on the product page",
                ].map((item, i) => (
                  <div key={i} className="csa-check-item">
                    <div className="csa-check-dot">✓</div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div className="csa-features">
            {[
              { icon: "🛡️", title: "Waterproof & Scratch Resistant", desc: "Outdoor durable for 3–5 years" },
              { icon: "✂️", title: "Auto Die-Cut Outline", desc: "Instant cutline generated on upload" },
              { icon: "📦", title: "No Minimum Orders", desc: "Customers can order as few as 1 sticker" },
              { icon: "🖼️", title: "Cart Design Preview", desc: "Design thumbnail shown in cart & checkout" },
              { icon: "📐", title: "Custom Sizes", desc: "Customers enter exact dimensions they need" },
              { icon: "💾", title: "Design Library", desc: "Logged-in customers can reuse saved designs" },
            ].map((f, i) => (
              <div key={i} className="csa-feature">
                <div className="csa-feature-icon">{f.icon}</div>
                <div className="csa-feature-text">
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </s-page>
    </>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};