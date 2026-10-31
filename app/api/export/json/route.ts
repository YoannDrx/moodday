import {
  getSession,
  getRequiredUser,
  RECENT_AUTHENTICATION_WINDOW_MS,
} from "@/lib/auth/auth-user";
import { createUserDataExportStream } from "@/features/account/user-data-export";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
  const authenticatedAt = new Date(session.session.createdAt).getTime();
  if (
    !Number.isFinite(authenticatedAt) ||
    Date.now() - authenticatedAt > RECENT_AUTHENTICATION_WINDOW_MS
  ) {
    return Response.json(
      { code: "recent_authentication_required" },
      { status: 403 },
    );
  }
  const user = await getRequiredUser();
  await enforceRateLimit({
    scope: "full-data-export",
    identifier: user.id,
    max: 3,
    windowSeconds: 60 * 60,
  });

  const date = new Date().toISOString().slice(0, 10);

  return new Response(createUserDataExportStream(user), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="moodday-export-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
