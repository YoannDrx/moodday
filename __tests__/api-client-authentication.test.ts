import { createApiClient } from "../packages/api-client/src";
import { describe, expect, it, vi } from "vitest";

describe("shared API client authentication invalidation", () => {
  it("invalidates the native session on a structured authentication error", async () => {
    const onAuthenticationRequired = vi.fn();
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: {
            code: "authentication_required",
            message: "Authentication required",
            recoverable: false,
            requestId: "request-auth-1",
          },
        },
        { status: 401 },
      ),
    );
    const client = createApiClient({
      baseUrl: "https://moodday.example",
      fetchImplementation,
      onAuthenticationRequired,
    });

    await expect(client.getEntitlements()).rejects.toMatchObject({
      code: "authentication_required",
      recoverable: false,
      requestId: "request-auth-1",
    });
    expect(onAuthenticationRequired).toHaveBeenCalledOnce();
  });

  it("does not invalidate the session for recoverable API failures", async () => {
    const onAuthenticationRequired = vi.fn();
    const client = createApiClient({
      baseUrl: "https://moodday.example",
      fetchImplementation: vi.fn<typeof fetch>(async () =>
        Response.json(
          {
            error: {
              code: "temporary_unavailable",
              message: "Try again",
              recoverable: true,
              requestId: "request-temporary-1",
            },
          },
          { status: 503 },
        ),
      ),
      onAuthenticationRequired,
    });

    await expect(client.getEntitlements()).rejects.toMatchObject({
      code: "temporary_unavailable",
    });
    expect(onAuthenticationRequired).not.toHaveBeenCalled();
  });
});
