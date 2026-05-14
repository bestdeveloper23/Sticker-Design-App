import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Replace HOST with SHOPIFY_APP_URL so the Vite server matches Shopify CLI tunneling.
// https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost").hostname;
let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: parseInt(process.env.FRONTEND_PORT, 10) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "react-router",
      "@shopify/app-bridge-react",
      "@shopify/shopify-app-react-router",
    ],
  },
  server: {
    allowedHosts: [host],
    cors: { preflightContinue: true },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    reactRouter({
      future: {
        v3_fetcherPersist: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  // Do not add bare "@shopify/shopify-app-react-router" here — its package.json has
  // no "." export (only "./server", "./react", etc.), so Vite fails resolving the entry.
  optimizeDeps: {
    include: ["@shopify/app-bridge-react"],
  },
  // Do not list "react" / "react-dom" here — they ship a CJS entry (module.exports).
  // ssr.noExternal inlines them as ESM and causes: ReferenceError: module is not defined.
  // Dedupe above still keeps a single React copy; Vercel SSR uses the server bundle output.
  ssr: {
    noExternal: [
      "react-router",
      "@shopify/app-bridge-react",
      "@shopify/shopify-app-react-router",
    ],
  },
});
