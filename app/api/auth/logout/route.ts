import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const parseCookies = (header: string | null) =>
  new Map(
    (header ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .flatMap((part) => {
        const separator = part.indexOf("=");
        return separator > 0
          ? ([[part.slice(0, separator), part.slice(separator + 1)]] as const)
          : [];
      }),
  );

const decodeCookieValue = (value: string | undefined) => {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

export const POST = async (request: Request) => {
  const host =
    request.headers.get("host") ?? request.headers.get("x-forwarded-host");
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (new URL(request.url).protocol === "https:" ? "https" : "http");
  const publicOrigin = host
    ? `${protocol}://${host}`
    : new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== publicOrigin) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 256) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  const body = await request.text();
  if (body.length > 256) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  if (new URLSearchParams(body).get("intent") !== "sign-out") {
    return NextResponse.json({ error: "Invalid intent" }, { status: 400 });
  }

  const cookies = parseCookies(request.headers.get("cookie"));
  const sessionCookie = [...cookies.entries()].find(([name]) =>
    name.endsWith("moodday.session_token"),
  );
  const signedValue = decodeCookieValue(sessionCookie?.[1]);
  const sessionToken = signedValue?.split(".", 1)[0];
  const deviceId = new URL(request.url).searchParams
    .get("deviceId")
    ?.slice(0, 128);

  if (sessionToken) {
    await prisma.$transaction(async (transaction) => {
      const session = await transaction.session.findUnique({
        where: { token: sessionToken },
        select: { userId: true },
      });
      if (session && deviceId) {
        await transaction.pushSubscription.deleteMany({
          where: { userId: session.userId, deviceId },
        });
      }
      await transaction.session.deleteMany({
        where: { token: sessionToken },
      });
    });
  }

  // Redirect directly to the public sign-in route. Redirecting through `/`
  // can race cookie processing in WebKit and trigger the authenticated root
  // redirect with a cookie that is being removed by this same response.
  const response = NextResponse.redirect(
    new URL("/auth/signin", publicOrigin),
    303,
  );
  [...cookies.keys()]
    .filter(
      (name) =>
        name.startsWith("moodday.") || name.startsWith("__Secure-moodday."),
    )
    .forEach((name) => {
      const secure = name.startsWith("__Secure-") ? "; Secure" : "";
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
      );
    });
  return response;
};
