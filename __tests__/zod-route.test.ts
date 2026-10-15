import { prisma } from "@/lib/prisma";
import { getAuthorizedApiUser } from "@/lib/auth/auth-user";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { logger } from "@/lib/logger";
import { authRoute, route } from "@/lib/zod-route";
import { describe, expect, it, vi } from "vitest";

describe("zod-route", () => {
  it("route should handle custom errors", async () => {
    const GET = route.handler(() => {
      throw new ZodRouteError("test");
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ message: "test" });
  });

  it("route should handle custom errors with status", async () => {
    const GET = route.handler(() => {
      throw new ZodRouteError("test", 401);
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ message: "test" });
  });

  it("route should handle unknown errors with 500 without leaking details", async () => {
    const GET = route.handler(() => {
      throw new Error("test");
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ message: "Internal server error" });
  });

  it("logs unexpected failures at error level with the Prisma code only", async () => {
    const errorLog = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    const GET = route.handler(() => {
      throw Object.assign(
        new Error("The column `Patient.secret` does not exist"),
        { name: "PrismaClientKnownRequestError", code: "P2022" },
      );
    });

    const response = await GET(new Request("http://localhost/"), {
      params: Promise.resolve({}),
    });

    expect(response.status).toBe(500);
    expect(errorLog).toHaveBeenCalledWith("Route failed", {
      eventName: "route_failed",
      status: "failed",
      errorCode: "PrismaClientKnownRequestError",
      prismaCode: "P2022",
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("secret");
    errorLog.mockRestore();
  });

  it("does not report non-Prisma error codes as Prisma codes", async () => {
    const errorLog = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);
    const GET = route.handler(() => {
      throw Object.assign(new Error("network"), { code: "ECONNRESET" });
    });

    await GET(new Request("http://localhost/"), {
      params: Promise.resolve({}),
    });

    expect(errorLog).toHaveBeenCalledWith("Route failed", {
      eventName: "route_failed",
      status: "failed",
      errorCode: "Error",
    });
    errorLog.mockRestore();
  });

  it("authRoute should return 401 if user is not authenticated", async () => {
    vi.mocked(getAuthorizedApiUser).mockResolvedValue(null);
    const GET = authRoute.handler(() => {
      return {
        message: "test",
      };
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({
      message: "Authenticated, verified account required",
    });
  });

  const user = {
    id: "123",
    email: "test@test.com",
    name: "test",
    emailVerified: true,
    createdAt: new Date(1, 1, 1, 1),
    updatedAt: new Date(1, 1, 1, 1),
    banned: null,
    twoFactorEnabled: false,
  };

  it("authRoute should add the user inside the context if the user is authenticated", async () => {
    vi.mocked(getAuthorizedApiUser).mockResolvedValue(user);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: 1 }]);

    const GET = authRoute.handler((_request, { ctx }) => {
      return {
        message: "test",
        user: ctx.user,
      };
    });

    const request = new Request("http://localhost/");
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({
      message: "test",
      user: JSON.parse(JSON.stringify(user)),
    });
  });
});
