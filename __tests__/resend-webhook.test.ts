import { Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { Webhook } from "svix";
import { beforeEach, describe, expect, it, vi } from "vitest";

const webhookSecret = vi.hoisted(
  () => "whsec_dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0",
);

vi.mock("@/lib/env", () => ({
  env: { MAINTENANCE_MODE: false, RESEND_WEBHOOK_SECRET: webhookSecret },
}));

import { POST } from "../app/api/webhooks/resend/route";

const mutableEnv = env as unknown as {
  MAINTENANCE_MODE: boolean;
  RESEND_WEBHOOK_SECRET?: string;
};

const payload = JSON.stringify({
  type: "email.delivered",
  created_at: "2026-08-12T12:00:00.000Z",
  data: { email_id: "email_test" },
});

const requestFor = (params: {
  signature?: string;
  timestamp?: Date;
  id?: string;
  body?: string;
  omitHeader?: "svix-id" | "svix-timestamp" | "svix-signature";
}) => {
  const timestamp = params.timestamp ?? new Date();
  const id = params.id ?? "msg_test";
  const body = params.body ?? payload;
  const headers = new Headers({
    "content-type": "application/json",
    "svix-id": id,
    "svix-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "svix-signature":
      params.signature ?? new Webhook(webhookSecret).sign(id, timestamp, body),
  });
  if (params.omitHeader) headers.delete(params.omitHeader);
  return new NextRequest("http://localhost/api/webhooks/resend", {
    method: "POST",
    body,
    headers,
  });
};

describe("Resend webhook", () => {
  beforeEach(() => {
    mutableEnv.MAINTENANCE_MODE = false;
    mutableEnv.RESEND_WEBHOOK_SECRET = webhookSecret;
    vi.mocked(prisma.emailWebhookEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.emailLog.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.emailWebhookEvent.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
  });

  it("defers signed delivery without writing during maintenance", async () => {
    mutableEnv.MAINTENANCE_MODE = true;

    const response = await POST(requestFor({}));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(await response.json()).toEqual({ error: "Unavailable" });
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("fails closed when the webhook is not configured", async () => {
    mutableEnv.RESEND_WEBHOOK_SECRET = undefined;

    const response = await POST(requestFor({}));

    expect(response.status).toBe(503);
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalled();
  });

  it.each(["svix-id", "svix-timestamp", "svix-signature"] as const)(
    "rejects a request missing %s",
    async (omitHeader) => {
      const response = await POST(requestFor({ omitHeader }));
      expect(response.status).toBe(401);
    },
  );

  it("rejects a missing or invalid signature without writing", async () => {
    const response = await POST(requestFor({ signature: "v1,invalid" }));
    expect(response.status).toBe(401);
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("rejects an old signed event without writing", async () => {
    const timestamp = new Date(Date.now() - 10 * 60_000);
    const response = await POST(requestFor({ timestamp }));
    expect(response.status).toBe(401);
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric timestamp", async () => {
    const request = requestFor({});
    request.headers.set("svix-timestamp", "not-a-number");

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("rejects a signed but structurally invalid event", async () => {
    const body = JSON.stringify({ type: 42, created_at: "invalid", data: {} });
    const response = await POST(requestFor({ body }));

    expect(response.status).toBe(400);
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("accepts a fresh signed event and records no raw payload", async () => {
    const response = await POST(requestFor({}));
    expect(response.status).toBe(200);
    expect(prisma.emailWebhookEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        svixId: "msg_test",
        type: "email.delivered",
        status: "processing",
      }),
    });
    expect(prisma.emailWebhookEvent.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payload: expect.anything() }),
      }),
    );
  });

  it("deduplicates an event that is not eligible for retry", async () => {
    vi.mocked(prisma.emailWebhookEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    vi.mocked(prisma.emailWebhookEvent.updateMany).mockResolvedValue({
      count: 0,
    });

    const response = await POST(requestFor({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, duplicate: true });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("reclaims a retry event and advances email status monotonically", async () => {
    vi.mocked(prisma.emailWebhookEvent.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    vi.mocked(prisma.emailWebhookEvent.updateMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.emailLog.findUnique).mockResolvedValue({
      status: "delivered",
      clickedAt: null,
    } as never);
    const body = JSON.stringify({
      type: "email.clicked",
      created_at: "2026-08-12T12:00:00.000Z",
      data: { email_id: "email_test" },
    });

    const response = await POST(requestFor({ body }));

    expect(response.status).toBe(200);
    expect(prisma.emailLog.update).toHaveBeenCalledWith({
      where: { resendId: "email_test" },
      data: {
        status: "clicked",
        clickedAt: new Date("2026-08-12T12:00:00.000Z"),
      },
    });
  });

  it("does not regress status or replace a newer provider timestamp", async () => {
    vi.mocked(prisma.emailLog.findUnique).mockResolvedValue({
      status: "clicked",
      deliveredAt: new Date("2026-08-13T12:00:00.000Z"),
    } as never);

    const response = await POST(requestFor({}));

    expect(response.status).toBe(200);
    expect(prisma.emailLog.update).toHaveBeenCalledWith({
      where: { resendId: "email_test" },
      data: {},
    });
  });

  it("accepts unrelated Resend event types without touching email state", async () => {
    const body = JSON.stringify({
      type: "email.sent",
      created_at: "2026-08-12T12:00:00.000Z",
      data: {},
    });

    const response = await POST(requestFor({ body }));

    expect(response.status).toBe(200);
    expect(prisma.emailLog.findUnique).not.toHaveBeenCalled();
    expect(prisma.emailLog.update).not.toHaveBeenCalled();
  });

  it("marks processing failures for retry without exposing details", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new TypeError("secret"));
    vi.mocked(prisma.emailWebhookEvent.updateMany).mockResolvedValue({
      count: 1,
    });

    const response = await POST(requestFor({}));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      code: "webhook_processing_failed",
    });
    expect(prisma.emailWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: { svixId: "msg_test", status: "processing" },
      data: expect.objectContaining({
        status: "retry",
        lastErrorCode: "TypeError",
      }),
    });
  });

  it("uses a generic error code for non-Error failures", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue("failure");
    vi.mocked(prisma.emailWebhookEvent.updateMany).mockResolvedValue({
      count: 1,
    });

    const response = await POST(requestFor({ id: "msg_unknown" }));

    expect(response.status).toBe(500);
    expect(prisma.emailWebhookEvent.updateMany).toHaveBeenCalledWith({
      where: { svixId: "msg_unknown", status: "processing" },
      data: expect.objectContaining({ lastErrorCode: "unknown_error" }),
    });
  });

  it("does not misclassify unexpected claim failures as duplicates", async () => {
    vi.mocked(prisma.emailWebhookEvent.create).mockRejectedValue(
      new Error("database unavailable"),
    );

    await expect(POST(requestFor({}))).rejects.toThrow("database unavailable");
  });
});
