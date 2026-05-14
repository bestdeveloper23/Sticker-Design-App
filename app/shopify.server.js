import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Must match shopify.app.toml scopes. read_orders required for orders/paid webhook.
const requiredScopes = (process.env.SCOPES || "write_products,write_app_proxy,read_orders")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// App URL: set SHOPIFY_APP_URL in production. On Vercel, fallback to https://VERCEL_URL when unset.
const appUrl =
  process.env.SHOPIFY_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: requiredScopes,
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;

const ADMIN_API_VERSION = "2025-10";

/**
 * Returns a minimal Admin GraphQL client for the given session (e.g. from webhooks).
 * Use this when you have a session but no request context (e.g. orders/paid webhook).
 */
export function adminGraphqlClient(session) {
  if (!session?.shop || !session?.accessToken) return null;
  return {
    async graphql(query, variables) {
      const url = `https://${session.shop}/admin/api/${ADMIN_API_VERSION}/graphql.json`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": session.accessToken,
        },
        body: JSON.stringify({ query, variables: variables ?? {} }),
      });
      return res;
    },
  };
}
