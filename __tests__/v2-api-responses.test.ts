import { apiError, withApiV2Route } from "@/lib/api-v2/responses";
import { describe, expect, it } from "vitest";

describe("V2 API response envelope", () => {
  it("normalizes validator errors before they reach shared clients", async () => {
    const handler = withApiV2Route(async () =>
      Response.json({ message: "Invalid body", errors: [] }, { status: 400 }),
    );
    const response = await handler(
      new Request("https://mood-day.fr/api/v2/check-ins", {
        headers: { "x-request-id": "request-1" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_request",
        message: "La requête contient des données invalides.",
        recoverable: true,
        requestId: "request-1",
      },
    });
  });

  it("preserves an error that already follows the V2 contract", async () => {
    const handler = withApiV2Route(async (_request: Request) =>
      apiError({
        code: "device_revoked",
        message: "Cet appareil a été révoqué.",
        recoverable: false,
        requestId: "request-2",
        status: 403,
      }),
    );
    const response = await handler(
      new Request("https://mood-day.fr/api/v2/sync/push"),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "device_revoked", recoverable: false },
    });
  });
});
