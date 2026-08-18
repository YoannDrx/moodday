import {
  handleRootRedirect,
  isAdminRoute,
  isAppRoute,
  redirectToSignIn,
  validateSession,
} from "@/lib/middleware-utils";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const maintenanceAllowedPaths = [
  "/",
  "/about",
  "/auth/verify",
  "/blog",
  "/careers",
  "/changelog",
  "/contact",
  "/crisis",
  "/guides",
  "/legal",
  "/maintenance",
  "/offline",
  "/posts",
  "/status",
];

const isAllowedDuringMaintenance = (pathname: string) =>
  maintenanceAllowedPaths.some(
    (allowedPath) =>
      pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
  );

export const buildContentSecurityPolicy = (nonce: string) =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
    } https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    // @react-pdf/renderer resolves its built-in PDF assets through data URLs
    // while producing the file locally in the browser. This does not open an
    // outbound destination and keeps user export data on the current device.
    "connect-src 'self' data: https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // Local production builds used by Playwright are served over HTTP. Only
    // instruct browsers to upgrade requests on the actual HTTPS production
    // deployment, otherwise WebKit upgrades localhost assets and auth calls
    // to an unavailable TLS endpoint.
    ...(process.env.VERCEL_ENV === "production"
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");

const secureResponse = (
  response: NextResponse,
  policy: string,
  requestId: string,
) => {
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("x-request-id", requestId);
  return response;
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  if (env.MAINTENANCE_MODE && !isAllowedDuringMaintenance(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    return secureResponse(
      NextResponse.redirect(url),
      contentSecurityPolicy,
      requestId,
    );
  }

  if (pathname === "/") {
    const response =
      handleRootRedirect(request) ??
      NextResponse.next({ request: { headers: requestHeaders } });
    return secureResponse(response, contentSecurityPolicy, requestId);
  }

  if (isAppRoute(pathname)) {
    const session = validateSession(request);
    if (!session) {
      return secureResponse(
        redirectToSignIn(request),
        contentSecurityPolicy,
        requestId,
      );
    }
  }

  if (isAdminRoute(pathname)) {
    const session = validateSession(request);
    if (!session) {
      return secureResponse(
        redirectToSignIn(request),
        contentSecurityPolicy,
        requestId,
      );
    }
  }

  return secureResponse(
    NextResponse.next({ request: { headers: requestHeaders } }),
    contentSecurityPolicy,
    requestId,
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
