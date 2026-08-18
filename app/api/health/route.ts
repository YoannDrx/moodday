import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

let cachedResult: { expiresAt: number; healthy: boolean } | undefined;

const checkDatabase = async () => {
  if (cachedResult && cachedResult.expiresAt > Date.now()) {
    return cachedResult.healthy;
  }
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("database_timeout")), 2_000),
      ),
    ]);
    cachedResult = { expiresAt: Date.now() + 5_000, healthy: true };
    return true;
  } catch {
    cachedResult = { expiresAt: Date.now() + 2_000, healthy: false };
    return false;
  }
};

export async function GET() {
  const healthy = await checkDatabase();
  return Response.json(
    { status: healthy ? "ok" : "degraded" },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "public, max-age=0, s-maxage=5" },
    },
  );
}
