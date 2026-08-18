import { SiteConfig } from "@/site-config";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const hasSessionCookie = (request: NextRequest) =>
  Boolean(
    getSessionCookie(request, {
      cookiePrefix: SiteConfig.appId,
    }),
  );

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;
  if (!hasSessionCookie(request)) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
};

export const isAppRoute = (pathname: string) => pathname.startsWith("/app");

export const isAdminRoute = (pathname: string) => pathname.startsWith("/admin");

/**
 * The proxy only performs a cheap cookie-presence check. Every protected
 * layout/action still performs authoritative server-side session and role
 * checks; importing Better Auth here would pull Prisma into the proxy bundle.
 */
export const validateSession = (request: NextRequest) =>
  hasSessionCookie(request);

export const redirectToSignIn = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/signin";
  return NextResponse.redirect(url);
};
