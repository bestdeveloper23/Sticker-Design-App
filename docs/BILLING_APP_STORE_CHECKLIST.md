# App Store billing compliance checklist

Use this before submitting your app to the Shopify App Store to avoid billing-related rejections.

---

## Step-by-step: What to do

### Step 1: Deploy your app and get a production URL

- Host your app on a server (e.g. **Vercel**, Fly.io, Heroku, Railway) so it has a **public HTTPS URL** (e.g. `https://your-app.vercel.app` or `https://app.yourdomain.com`).
- Make sure the app runs and is reachable at that URL.

**If you use Vercel:**
- This app is **React Router v7**, not Next.js. The project includes `@vercel/react-router` and `react-router.config.js` with the Vercel preset so Vercel builds it correctly.
- In Vercel: **Project Settings → General → Framework Preset** → set to **"React Router"** (or **"Other"** with Build Command `npm run build`). Do not leave it set to "Next.js" or you will see "No Next.js version detected".
- Ensure **Root Directory** is the folder that contains `package.json` (usually the repo root).
- Add env vars in Vercel (e.g. `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`). For Prisma, use a hosted DB (e.g. Vercel Postgres, Neon) and run migrations before or during deploy.

### Step 2: Set the app URL in config

1. Open **`shopify.app.toml`** in the project root.
2. Set **`application_url`** to your production URL:
   ```toml
   application_url = "https://your-actual-app-url.com"
   ```
3. In the **`[auth]`** section, set **`redirect_urls`** to use the same domain:
   ```toml
   [auth]
   redirect_urls = [ "https://your-actual-app-url.com/api/auth" ]
   ```
4. Save the file.

### Step 3: Run database migrations (ShopBilling table)

In the project folder, run:

```bash
npx prisma generate
```

Then:

```bash
npx prisma migrate dev --name add_shop_billing
```

(On Windows PowerShell, run the two commands separately if `&&` does not work.)

- For **production**, run the same migrations against your **production database** (e.g. `npx prisma migrate deploy` when your env points to the prod DB).

### Step 4: Deploy and update URLs in Partner Dashboard (if needed)

1. Deploy the latest code to your production host.
2. In **Shopify Partner Dashboard** → your app → **App setup** (or **Configuration**), ensure:
   - **App URL** = your production `application_url`.
   - **Allowed redirection URL(s)** include `https://your-actual-app-url.com/api/auth`.
3. If you use the Shopify CLI to push config: run `shopify app deploy` (or your usual deploy command) so the toml values are synced.

### Step 5: Test the billing flow on a development store

1. Create or use a **development store** in Partner Dashboard.
2. **Install** your app on that store (install link from the app’s “Test your app” or “Preview URL”).
3. When the app loads, you should be **redirected to approve the usage-based charge**. Approve it.
4. You should be redirected **back into the app**.
5. Place a **test sticker order** (use a product with the “Sticker Designer” tag and complete a design so the order has `_Design_URL` or `Design_URL`). Pay for the order.
6. In the store: **Settings → Billing** (or **Apps and sales channels** → your app → Billing). After the **first 10 sticker orders** (free trial), you should see a **usage charge** (1.5% of that order’s total).

### Step 6: Prepare your App Store listing

1. In Partner Dashboard, open your app’s **App Store listing** (or “Listings”).
2. In **Pricing**, describe the plan clearly, for example:
   - **Free trial:** First 10 sticker orders.
   - **After trial:** 1.5% of each sticker order total (capped at $999 per billing period).
3. Keep all pricing text in the **designated pricing fields** only. Do **not** put pricing in screenshots, logos, or other undesignated areas.
4. Fill in required fields (screenshots, description, support contact, etc.) as per the submission form.

### Step 7: Submit for review

1. Complete any remaining **App Store requirements** (e.g. demo video, test store instructions).
2. **Submit** the app for review from the Partner Dashboard.
3. After approval, new installs will be prompted to approve billing on first open, and usage charges will apply after the first 10 sticker orders per store.

---

## Requirements (Shopify App Store 1.2.x)

- **1.2.1** Use Shopify Billing API for all app charges. ✅ This app uses `appSubscriptionCreate` (usage-based) and `appUsageRecordCreate`.
- **1.2.2** Implement correctly: accept, decline, and request approval again on reinstall. ✅ Merchant is redirected to `confirmationUrl` when there is no active subscription; on reinstall the same check runs and prompts approval again.
- **1.2.3** Allow pricing plan changes. ✅ Single plan; merchants can manage/cancel in Shopify Admin → Settings → Billing.

## Scopes (required for billing)

- **`read_orders`** – Required to receive the `orders/paid` webhook payload. Configured in `shopify.app.toml` and `app/shopify.server.js`.
- Billing API (`appSubscriptionCreate`, `appUsageRecordCreate`) is available without a separate `applications_billing` scope; do not add that scope (it is invalid and causes "invalid scope" errors).

## Before first publish

1. **Set `application_url`**  
   In `shopify.app.toml`, set `application_url` to your real production URL (HTTPS). Update `[auth] redirect_urls` to match (e.g. `https://your-domain.com/api/auth`). Webhooks and billing redirects will fail if this points to example.com.

2. **Run Prisma migrations**  
   Ensure `ShopBilling` exists:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name add_shop_billing
   ```
   For production, run your DB migrations on the live database.

3. **Test billing flow**  
   - Install the app on a development store.
   - Confirm you are redirected to approve the usage-based charge, then back to the app.
   - Place a test sticker order (with `_Design_URL` or `Design_URL` on a line item) and pay.
   - After the free trial (10 orders), confirm a usage charge appears (1.5% of order total) in the store’s Settings → Billing or in Partner Dashboard.

4. **Listing / pricing**  
   - In the App Store listing, describe pricing accurately: e.g. “Free trial: first 10 sticker orders. Then 1.5% of sticker order total per order (capped at $999 per billing period).”
   - Do not put pricing in images or undesignated areas (4.2.x).

## Implementation summary

| Item | Location |
|------|----------|
| Usage subscription + capped amount | `app/billing.server.js` – `ensureBillingSubscription`, `appSubscriptionCreate` |
| Free trial (10 orders) | `app/billing.server.js` – `FREE_TRIAL_STICKER_ORDERS`, `recordStickerOrderAndCharge` |
| Usage record (1.5%) | `app/billing.server.js` – `recordStickerOrderAndCharge`, `appUsageRecordCreate` |
| Idempotency (no duplicate charges) | `app/billing.server.js` – `idempotencyKey: sticker-order-{order.id}` |
| Currency handling | `app/billing.server.js` – `SUPPORTED_BILLING_CURRENCIES`, fallback to USD |
| Billing gate on app load | `app/routes/app._index.jsx` – loader calls `ensureBillingSubscription`, redirects to `confirmationUrl` if needed |
| orders/paid webhook | `app/routes/webhooks.orders.paid.jsx` – calls `recordStickerOrderAndCharge` |
| Webhook registration | `shopify.app.toml` – `topics = ["orders/paid"]`, `uri = "/webhooks/orders/paid"` |

## Optional (recommended)

- **APP_SUBSCRIPTIONS_UPDATE** webhook – To react when the merchant changes capped amount or subscription status. Not required for basic compliance.
- **APP_SUBSCRIPTIONS_APPROACHING_CAPPED_AMOUNT** – To notify when usage is near the cap. Not required for basic compliance.
