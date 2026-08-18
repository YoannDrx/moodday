import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("health endpoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(prisma.$queryRaw).mockReset();
  });

  it("returns a minimal ok response and briefly caches DB availability", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ result: 1 }]);
    const { GET } = await import("../app/api/health/route");

    const first = await GET();
    const second = await GET();

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ status: "ok" });
    expect(first.headers.get("cache-control")).toBe(
      "public, max-age=0, s-maxage=5",
    );
    expect(second.status).toBe(200);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns degraded without exposing the database exception", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error("secret infrastructure detail"),
    );
    const { GET } = await import("../app/api/health/route");

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "degraded" });
  });
});
