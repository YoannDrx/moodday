import { auth } from "@/lib/auth";
import { SiteConfig } from "@/site-config";
import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const handleRootRedirect = (request: NextRequest) => {
  if (!SiteConfig.features.enableLandingRedirection) return null;

  const session = getSessionCookie(request, {
    cookiePrefix: SiteConfig.appId,
  });

  if (!session) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
};

export const isAppRoute = (pathname: string) => {
  return pathname.startsWith("/app");
};

export const isAdminRoute = (pathname: string) => {
  return pathname.startsWith("/admin");
};

export const validateSession = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.session.userId) return null;

  return session;
};

export const redirectToSignIn = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/signin";
  return NextResponse.redirect(url);
};

export const redirectToUnauthorized = (request: NextRequest) => {
  const url = request.nextUrl.clone();
  url.pathname = "/unauthorized";
  return NextResponse.redirect(url);
};
