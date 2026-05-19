import { Outlet, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";

<<<<<<< HEAD
=======
/** Same Node bundle as /app/* children so Vercel traces `react-router` for embedded admin routes. */
export const config = { runtime: "nodejs" };

>>>>>>> 2a982d2 (merged)
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
     <s-app-nav>
      <s-link href="/app">Home</s-link>
      <s-link href="/app/settings">Sticker settings</s-link>
      <s-link href="/app/additional">Pricing</s-link>
      <s-link href="/app/privacy">Privacy Policy</s-link>
    </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Do not export a route ErrorBoundary here. React Router wraps it with
// WithErrorBoundaryProps (useParams/useLoaderData inside the wrapper). When a
// loader error occurs before route context is stable—often in Vite dev with
// tunneling—that wrapper can run with a null context and crash with
// "Cannot read properties of null (reading 'useContext')". Errors bubble to
// root.jsx instead. boundary.headers below still applies Shopify document headers.
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
