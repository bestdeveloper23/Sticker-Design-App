# Custom Sticker Designer – Testing Guide

Use this checklist to verify all app features before publishing or after changes.

---

## Prerequisites

- **Development store** with the app installed
- **Theme** with the app blocks added (Custom Design block on product page, Cart Sticker Images block on cart if applicable)
- **Designer app** (e.g. Replit) running and reachable from the store
- **Environment variables** set (SHOPIFY_API_KEY, SHOPIFY_API_SECRET, DATABASE_URL, SHOPIFY_APP_URL)

---

## 1. Admin App (Embedded)

**Goal:** Confirm the app loads inside Shopify Admin and billing works.

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open **Shopify Admin** → **Apps** → **Custom Sticker Designer** | App loads in the Admin iframe (no "Receiving end does not exist") |
| 1.2 | On first install, approve the usage-based billing plan when redirected | Redirect to Shopify billing confirmation, then back to app |
| 1.3 | Grant **write_draft_orders** scope when prompted (if shown) | Scope request succeeds |
| 1.4 | Use any admin feature (e.g. "Generate a product") | Feature works without errors |

**Note:** Do not open the app URL directly in a new tab; always use **Apps → Custom Sticker Designer** in the Admin.

---

## 2. Theme Extension – Product Page (Design Now)

**Goal:** Design block shows only on products tagged "Sticker Designer".

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Create a product **without** the "Sticker Designer" tag | No "Design Now" block on the product page |
| 2.2 | Add tag **"Sticker Designer"** to the product | "Design Now" block appears on the product page |
| 2.3 | Open the product page and click **Design Now** | Designer app (iframe) loads |
| 2.4 | In Theme Editor, change the block’s **Product tag** setting (if available) | Block visibility follows the configured tag |

---

## 3. Designer Flow (Design → Add to Cart)

**Goal:** Customer can design a sticker and add it to the cart with design data.

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | On a "Sticker Designer" product page, upload an image and configure size/quantity | Designer steps complete |
| 3.2 | Click **Add to Cart** (or equivalent) in the designer | Design is saved; postMessage sends designUrl to parent |
| 3.3 | Click **Complete My Order** / **Continue to Checkout** | Redirect to cart or checkout with the item |
| 3.4 | Check **Cart** page | Item has line item properties; Design_URL / _Design_URL may be hidden (see §4) |
| 3.5 | Complete checkout | Order is placed successfully |

---

## 4. Cart – Hidden Design URL

**Goal:** Design URL is hidden on the cart page but still saved with the order.

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Add a sticker design to the cart (with Design_URL / _Design_URL) | Cart shows the item |
| 4.2 | Inspect cart line item properties | Design_URL / _Design_URL are not visible (or are hidden via CSS) |
| 4.3 | Change quantity of the sticker item | Design URL stays hidden after cart refresh |
| 4.4 | Place the order | Order details in Admin include Design_URL / _Design_URL |

---

## 5. Order Details – Design URL Present

**Goal:** Design URL is stored on the order for production/fulfillment.

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Place an order that includes a sticker design | Order appears in **Orders** |
| 5.2 | Open the order in **Shopify Admin** | Line item shows custom properties |
| 5.3 | Check for **Design_URL** or **_Design_URL** | Property is present and contains the design URL |
| 5.4 | Check for **Original_Image_URL** (if used) | Property is present when applicable |

---

## 6. App Proxy (Create Draft / Designs)

**Goal:** App proxy routes work for draft orders and designs.

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Use the designer to create a draft order (custom size/quantity) | POST to `/apps/custom-stickers/create-draft` succeeds |
| 6.2 | Check response | Returns `checkoutUrl` or error as appropriate |
| 6.3 | If "My Designs" exists, load designs | GET `/apps/custom-stickers/designs?customerId=...` returns design list |
| 6.4 | Verify proxy URL format | `https://{store}/apps/custom-stickers/...` routes to the app |

---

## 7. Webhooks

**Goal:** Webhooks are registered and processed.

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | In Partner Dashboard → App → **Configuration** → **Webhooks** | Subscriptions exist for `app/uninstalled`, `app/scopes_update`, `orders/paid` |
| 7.2 | Place and pay for a sticker order | `orders/paid` webhook is sent |
| 7.3 | Check app logs (Vercel, server logs) | No 4xx/5xx for webhook endpoint; handler runs successfully |

---

## 8. Billing (Free Trial + Usage Charges)

**Goal:** Billing flow and usage charges work as configured.

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Install app on a fresh store | Redirect to approve usage-based subscription |
| 8.2 | Approve the plan | Redirect back to app; subscription is active |
| 8.3 | Place **1–10** sticker orders (free trial) | No usage charges; orders complete normally |
| 8.4 | Place **11th** sticker order | Usage charge (1.5% of order total) appears in store **Settings → Billing** or Partner Dashboard |
| 8.5 | Check **Shopify Admin → Settings → Billing** | App subscription and usage charges are visible |
| 8.6 | Uninstall and reinstall the app | Billing approval is requested again on reinstall |

---

## 9. Checkout – Design URL Hidden

**Goal:** Design URL does not appear on the checkout page.

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Add a sticker design to the cart | Proceed to checkout |
| 9.2 | Review checkout page | Design_URL / _Design_URL are not shown to the customer |

---

## 10. Quick Smoke Test (Minimal)

If time is limited, run this minimal flow:

1. Open app from **Shopify Admin** → **Apps** → Custom Sticker Designer.
2. Approve billing if prompted.
3. Add "Sticker Designer" tag to a product.
4. Open that product on the storefront and complete a design.
5. Add to cart and place the order.
6. In Admin, confirm the order has Design_URL and (after 10 orders) that a usage charge was created.

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| "Receiving end does not exist" | Open app from **Apps** in Admin, not by loading the app URL directly |
| Design block not showing | Product has "Sticker Designer" tag; block is added in Theme Editor |
| Design URL on checkout | Ensure properties use `_Design_URL` (underscore prefix) for hidden properties |
| Webhook not firing | Webhook URL matches `application_url`; app is deployed and reachable |
| Billing not charging | `orders/paid` webhook is registered; `read_orders` scope is granted; database has ShopBilling |
