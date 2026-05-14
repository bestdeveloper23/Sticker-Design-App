import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "react-router";

function formatRouteError(error) {
  if (isRouteErrorResponse(error)) {
    const headline = [String(error.status), error.statusText]
      .filter(Boolean)
      .join(" ");
    let detail = null;
    const { data } = error;
    if (data != null) {
      if (typeof data === "string") {
        detail = data;
      } else if (
        typeof data === "object" &&
        data !== null &&
        "message" in data
      ) {
        const m = data.message;
        detail =
          typeof m === "string" ? m : JSON.stringify(data, null, 2);
      } else {
        try {
          detail = JSON.stringify(data, null, 2);
        } catch {
          detail = String(data);
        }
      }
    }
    return { headline: headline || "Request error", detail };
  }
  if (error instanceof Error) {
    return {
      headline: `${error.name}: ${error.message}`,
      detail: import.meta.env.DEV ? error.stack ?? null : null,
    };
  }
  if (typeof error === "string") {
    return { headline: error, detail: null };
  }
  return {
    headline: "Something went wrong",
    detail: error != null ? String(error) : null,
  };
}

/**
 * Polaris web components (<s-page>, etc.) only render after polaris.js runs.
 * See https://shopify.dev/docs/api/app-home/polaris-web-components
 */
export async function loader() {
  return {
    shopifyApiKey: process.env.SHOPIFY_API_KEY ?? "",
  };
}

export default function App() {
  const { shopifyApiKey } = useLoaderData();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-api-key" content={shopifyApiKey} />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { headline, detail } = formatRouteError(error);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <title>Custom Sticker Designer – Error</title>
      </head>
      <body
        style={{
          fontFamily: "Inter, sans-serif",
          padding: "2rem",
          maxWidth: "720px",
          margin: "0 auto",
        }}
      >
        <h1>Application error</h1>
        <p style={{ fontWeight: 600 }}>{headline}</p>
        {detail ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: "0.85rem",
              background: "#f6f6f7",
              padding: "1rem",
              borderRadius: "8px",
              overflow: "auto",
            }}
          >
            {detail}
          </pre>
        ) : null}
        <p style={{ color: "#6d7175", fontSize: "0.9rem" }}>
          Every page under <code>/app</code> (including any nav links you added)
          runs authentication and loads the session from Postgres first. If that
          step fails, all subpages show the same error—not a problem with the
          links themselves.
        </p>
        <p style={{ color: "#6d7175", fontSize: "0.9rem" }}>
          If the detail above mentions database, Prisma, or connection errors,
          set <code>DATABASE_URL</code> on your host, ensure migrations ran (
          <code>prisma migrate deploy</code>), and that the database accepts
          connections from your server (e.g. Vercel). Also confirm{" "}
          <code>SHOPIFY_API_KEY</code>, <code>SHOPIFY_API_SECRET</code>, and{" "}
          <code>SHOPIFY_APP_URL</code> match your deployment and Partner
          Dashboard app URLs.
        </p>
        <Scripts />
      </body>
    </html>
  );
}
