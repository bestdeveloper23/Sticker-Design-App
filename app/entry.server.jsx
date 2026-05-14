import { PassThrough } from "node:stream";
import { createElement } from "react";
import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { addDocumentResponseHeaders } from "./shopify.server";

/**
 * Same streaming SSR pattern as @vercel/react-router/entry.server, inlined so
 * dev/prod always wrap the app in ServerRouter (required for useLoaderData).
 */
export const streamTimeout = 5000;

const vercelDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;
const vercelSkewProtectionEnabled =
  process.env.VERCEL_SKEW_PROTECTION_ENABLED === "1";

export default function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
  _loadContext,
  options,
) {
  addDocumentResponseHeaders(request, responseHeaders);

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let status = responseStatusCode;
    const userAgent = request.headers.get("user-agent");
    const readyOption =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    const { pipe, abort } = renderToPipeableStream(
      createElement(ServerRouter, {
        context: routerContext,
        url: request.url,
        nonce: options?.nonce,
      }),
      {
        ...options,
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          if (vercelSkewProtectionEnabled && vercelDeploymentId) {
            responseHeaders.append(
              "Set-Cookie",
              `__vdpl=${vercelDeploymentId}; HttpOnly`,
            );
          }
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status,
            }),
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          status = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, streamTimeout + 1000);
  });
}
