import { getUser } from "@/lib/auth/auth-user";
import { buildUserDataExport } from "@/features/account/user-data-export";
import { createJsonDownloadStream } from "@/features/account/json-download";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const exported = await buildUserDataExport(user);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(
    createJsonDownloadStream(exported as Record<string, unknown>),
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="moodday-export-${date}.json"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
