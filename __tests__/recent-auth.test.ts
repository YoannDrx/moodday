import {
  hasRecentAuthentication,
  RECENT_AUTHENTICATION_WINDOW_MS,
} from "@/lib/auth/recent-auth";
import { describe, expect, it } from "vitest";

const NOW = new Date("2026-08-13T12:00:00.000Z").getTime();

describe("recent authentication", () => {
  it("accepts only a valid session strictly inside the ten-minute window", () => {
    expect(
      hasRecentAuthentication(
        {
          session: {
            createdAt: new Date(NOW - RECENT_AUTHENTICATION_WINDOW_MS + 1),
          },
        },
        NOW,
      ),
    ).toBe(true);
    expect(
      hasRecentAuthentication(
        {
          session: {
            createdAt: new Date(NOW - RECENT_AUTHENTICATION_WINDOW_MS),
          },
        },
        NOW,
      ),
    ).toBe(false);
  });

  it.each([
    null,
    {},
    { session: null },
    { session: {} },
    {
      session: { createdAt: "invalid" },
    },
  ])("rejects missing or invalid session freshness", (session) => {
    expect(hasRecentAuthentication(session, NOW)).toBe(false);
  });
});
