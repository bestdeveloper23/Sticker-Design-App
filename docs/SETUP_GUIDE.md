# Custom Sticker Designer – Full Setup Guide

Configure frontend and backend for local development and production (Vercel).

---

## 1. Database (Required for Production)

**SQLite does not work on Vercel** (serverless, no persistent file storage). Use **PostgreSQL**.

### Option A: Vercel Postgres

1. In Vercel project → **Storage** → **Create Database** → **Postgres**.
2. Connect it to your project.
3. Vercel adds `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, etc. Use `POSTGRES_PRISMA_URL` or `DATABASE_URL` for Prisma.

### Option B: Neon (Free tier)

1. Go to [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string (e.g. `postgresql://user:pass@host/db?sslmode=require`).
3. In Vercel → **Settings** → **Environment Variables** → add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon connection string

### Option C: Other (Railway, Supabase, PlanetScale, etc.)

Create a PostgreSQL database and set `DATABASE_URL` in Vercel to the connection string.

---

## 2. Prisma Schema (PostgreSQL for Production)

Your `prisma/schema.prisma` must use PostgreSQL and `DATABASE_URL` for production. See the schema section below.

---

## 3. Run Migrations (Create Session + ShopBilling Tables)

The error **"Prisma session table does not exist"** means migrations have not been run against your production database.

### Local (first time)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### Production (Vercel)

**Option 1: Run before deploy (recommended)**

```bash
# Point to production DB (set DATABASE_URL in .env or export it)
export DATABASE_URL="postgresql://..."   # or use .env
npx prisma migrate deploy
```

**Option 2: Run during Vercel build (already configured)**

The `package.json` build script runs `prisma generate && prisma migrate deploy` before the app build. Ensure `DATABASE_URL` is set in Vercel so migrations run during deploy.

---

## 4. Environment Variables

### Local (`.env` in project root)

```env
# Shopify (from Partner Dashboard → App → Client credentials)
SHOPIFY_API_KEY=your_client_id
SHOPIFY_API_SECRET=your_client_secret

# App URL (local dev: use ngrok or Shopify CLI tunnel)
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io

# Database (PostgreSQL - required; use Neon free tier or local Postgres)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

### Vercel (Settings → Environment Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_API_KEY` | Yes | Client ID from Partner Dashboard |
| `SHOPIFY_API_SECRET` | Yes | Client secret from Partner Dashboard |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SHOPIFY_APP_URL` | Recommended | Your app URL (e.g. `https://your-app.vercel.app`) |
| `SCOPES` | Optional | Override scopes (default from toml) |

---

## 5. Prisma Schema for PostgreSQL

Update `prisma/schema.prisma` to use PostgreSQL and `DATABASE_URL`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // optional, for connection pooling
}
```

If you use Neon or Vercel Postgres, they often provide:
- `DATABASE_URL` or `POSTGRES_PRISMA_URL` (pooled)
- `DIRECT_URL` or `POSTGRES_URL_NON_POOLING` (direct, for migrations)

---

## 6. Checklist

- [ ] PostgreSQL database created (Vercel Postgres, Neon, etc.)
- [ ] `DATABASE_URL` set in Vercel
- [ ] `prisma/schema.prisma` uses `provider = "postgresql"` and `url = env("DATABASE_URL")`
- [ ] `npx prisma migrate deploy` run against production DB (or in build)
- [ ] `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` set in Vercel
- [ ] `SHOPIFY_APP_URL` set in Vercel (or rely on VERCEL_URL fallback)
- [ ] `shopify.app.toml` `application_url` matches your Vercel URL

---

## 7. "useContext" / "Unexpected Server Error"

The **"Cannot read properties of null (reading 'useContext')"** error often appears when:

1. **Session/DB fails first** – Prisma can't get the session, the request fails, and React Router hits a null context. Fixing the database usually resolves this.
2. **React context used outside provider** – Ensure components that use `useParams`, `useLoaderData`, etc. are rendered inside the correct Router/Provider tree.

**First step:** Fix the Prisma session table (run migrations). If the error persists after that, it may be a separate React Router/SSR issue.
