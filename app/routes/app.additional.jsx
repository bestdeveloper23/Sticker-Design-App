import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { hasSubscription: true, confirmationUrl: null };
};
const styles = `
  .csa-pricing {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .csa-pricing-hero {
    text-align: center;
    padding: 36px 24px 28px;
    background: linear-gradient(135deg, #1a6fe8 0%, #0f4fc0 100%);
    border-radius: 16px;
    color: white;
    margin-bottom: 28px;
  }

  .csa-pricing-hero h2 {
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 8px 0;
  }

  .csa-pricing-hero p {
    font-size: 14px;
    opacity: 0.85;
    margin: 0;
  }

  .csa-plan-card {
    background: white;
    border: 2px solid #1a6fe8;
    border-radius: 16px;
    padding: 32px;
    max-width: 520px;
    margin: 0 auto 28px;
    box-shadow: 0 8px 32px rgba(26,111,232,0.12);
    position: relative;
    overflow: hidden;
  }

  .csa-plan-card::before {
    content: "MOST POPULAR";
    position: absolute;
    top: 16px;
    right: -28px;
    background: #1a6fe8;
    color: white;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 36px;
    transform: rotate(45deg);
  }

  .csa-plan-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .csa-plan-name {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
  }

  .csa-plan-badge {
    background: #eff6ff;
    color: #1a6fe8;
    border: 1px solid #bfdbfe;
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  .csa-plan-price {
    margin-bottom: 20px;
  }

  .csa-plan-price .amount {
    font-size: 48px;
    font-weight: 900;
    color: #1a6fe8;
    line-height: 1;
  }

  .csa-plan-price .period {
    font-size: 16px;
    color: #6b7280;
    font-weight: 500;
  }

  .csa-plan-price .note {
    display: block;
    font-size: 12px;
    color: #9ca3af;
    margin-top: 2px;
  }

  .csa-plan-divider {
    border: none;
    border-top: 1px solid #e8eaed;
    margin: 20px 0;
  }

  .csa-plan-features {
    list-style: none;
    padding: 0;
    margin: 0 0 24px 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .csa-plan-features li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #374151;
    font-weight: 500;
  }

  .csa-plan-features li::before {
    content: "✓";
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #1a6fe8;
    color: white;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-weight: 700;
  }

  .csa-subscribe-btn {
    width: 100%;
    background: linear-gradient(135deg, #1a6fe8, #0f4fc0);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    letter-spacing: 0.3px;
  }

  .csa-subscribe-btn:hover {
    opacity: 0.92;
    transform: translateY(-1px);
  }

  .csa-subscribe-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .csa-active-badge {
    width: 100%;
    background: #f0fdf4;
    border: 2px solid #16a34a;
    color: #15803d;
    border-radius: 10px;
    padding: 14px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .csa-faq {
    max-width: 520px;
    margin: 0 auto;
  }

  .csa-faq h3 {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 16px 0;
  }

  .csa-faq-item {
    border-bottom: 1px solid #e8eaed;
    padding: 14px 0;
  }

  .csa-faq-item:last-child {
    border-bottom: none;
  }

  .csa-faq-q {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .csa-faq-a {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
  }
`;

export default function PricingPage() {
  const { hasSubscription, confirmationUrl } = useLoaderData() || {};

  return (
    <>
      <style>{styles}</style>
      <s-page heading="Pricing">
        <div className="csa-pricing">

          <div className="csa-pricing-hero">
            <h2>Simple, Transparent Pricing</h2>
            <p>No commissions. No per-order fees. One flat monthly rate.</p>
          </div>

          <div className="csa-plan-card">
            <div className="csa-plan-header">
              <span className="csa-plan-name">⭐ Pro Plan</span>
              <span className="csa-plan-badge">PRO</span>
            </div>

            <div className="csa-plan-price">
              <span className="amount">$19</span>
              <span className="period"> / month</span>
              <span className="note">Billed monthly through Shopify. Cancel anytime.</span>
            </div>

            <hr className="csa-plan-divider" />

            <ul className="csa-plan-features">
              <li>Unlimited sticker designs</li>
              <li>Custom size & quantity</li>
              <li>Auto die-cut outline</li>
              <li>Design preview in cart</li>
              <li>Draft order support</li>
              <li>Design library</li>
              <li>No minimum orders</li>
              <li>Email support</li>
            </ul>

            {hasSubscription ? (
              <div className="csa-active-badge">
                ✅ Pro Plan Active — You're all set!
              </div>
            ) : confirmationUrl ? (
              <button
                className="csa-subscribe-btn"
                onClick={() => { window.top.location.href = confirmationUrl; }}
              >
                Subscribe Now — $19/month →
              </button>
            ) : (
              <button className="csa-subscribe-btn" disabled>
                Loading billing info...
              </button>
            )}
          </div>

          <div className="csa-faq">
            <h3>Frequently Asked Questions</h3>
            {[
              {
                q: "When am I charged?",
                a: "Once per month through your Shopify invoice. The charge appears alongside your other Shopify billing."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your Shopify admin under Apps → Custom Sticker App. No questions asked."
              },
              {
                q: "Is there a free trial?",
                a: "Please contact our support team for trial availability and onboarding assistance."
              },
              {
                q: "What happens to my customers' designs if I cancel?",
                a: "Existing order data is preserved. New design sessions will be disabled until you resubscribe."
              }
            ].map((item, i) => (
              <div key={i} className="csa-faq-item">
                <div className="csa-faq-q">{item.q}</div>
                <div className="csa-faq-a">{item.a}</div>
              </div>
            ))}
          </div>

        </div>
      </s-page>
    </>
  );
}