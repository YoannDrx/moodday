import { auth } from "@/lib/auth";
import { claimEmailVerificationToken } from "@/lib/auth/email-verification-replay";
import { hasRecentAuthentication } from "@/lib/auth/recent-auth";
import { getSignupAccess } from "@/lib/auth/signup-access";
import { isMaintenanceMode } from "@/lib/maintenance";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

const recentAuthenticationPaths = new Set([
  "/api/auth/change-email",
  "/api/auth/delete-user",
  "/api/auth/passkey/delete-passkey",
  "/api/auth/passkey/update-passkey",
  "/api/auth/two-factor/disable",
  "/api/auth/two-factor/enable",
  "/api/auth/two-factor/generate-backup-codes",
  "/api/auth/two-factor/view-backup-codes",
]);

const maintenanceAllowedPostPaths = new Set(["/api/auth/sign-out"]);

const enforceSignupAccess = async (request: Request) => {
  if (new URL(request.url).pathname !== "/api/auth/sign-up/email") return null;

  const body = (await request
    .clone()
    .json()
    .catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : undefined;
  const decision = getSignupAccess(email);
  if (decision.allowed) return null;

  return Response.json(
    {
      code: decision.code,
      error:
        decision.code === "SIGNUP_CLOSED"
          ? "Account creation is currently closed"
          : "Account creation requires an invitation",
    },
    {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    },
  );
};

const requireRecentAuthentication = async (request: Request) => {
  if (!recentAuthenticationPaths.has(new URL(request.url).pathname)) {
    return null;
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
  if (!hasRecentAuthentication(session)) {
    return Response.json(
      { error: "Recent authentication required" },
      { status: 403 },
    );
  }
  return null;
};

export async function POST(request: Request) {
  if (
    isMaintenanceMode() &&
    !maintenanceAllowedPostPaths.has(new URL(request.url).pathname)
  ) {
    return Response.json(
      { error: "Moodday is temporarily in maintenance mode" },
      { status: 503, headers: { "retry-after": "300" } },
    );
  }
  const signupUnavailable = await enforceSignupAccess(request);
  if (signupUnavailable) return signupUnavailable;
  const unauthorized = await requireRecentAuthentication(request);
  return unauthorized ?? handlers.POST(request);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.pathname === "/api/auth/verify-email") {
    const token = url.searchParams.get("token") ?? "";
    if (!(await claimEmailVerificationToken(token))) {
      return Response.json(
        { error: "Invalid or already used token" },
        { status: 400 },
      );
    }
  }
  return handlers.GET(request);
}
