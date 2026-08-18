import {
  getRequestId,
  getRequestLogFields,
} from "@/lib/operations/request-context";
import { describe, expect, it, vi } from "vitest";

describe("operational request context", () => {
  it("preserves a safe upstream request identifier", () => {
    const request = new Request("https://moodday.invalid/api/health", {
      headers: { "x-request-id": "request_2026-08-13.safe" },
    });
    expect(getRequestId(request)).toBe("request_2026-08-13.safe");
  });

  it("replaces unsafe or oversized identifiers", () => {
    const randomUUID = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000000");
    const request = new Request("https://moodday.invalid/api/health", {
      headers: { "x-request-id": "unsafe identifier\nvalue" },
    });

    expect(getRequestId(request)).toBe("00000000-0000-4000-8000-000000000000");
    randomUUID.mockRestore();
  });

  it("emits only the common structured fields", () => {
    expect(
      getRequestLogFields({
        requestId: "request-1",
        route: "/api/health",
        startedAt: Date.now() - 5,
      }),
    ).toEqual({
      requestId: "request-1",
      route: "/api/health",
      durationMs: expect.any(Number),
    });
  });
});
