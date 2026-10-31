import { expect, it, vi } from "vitest";
import { createApiClient } from "../packages/api-client/src";

// Exercise the public transport contract independently of the server implementation:
// credentials, verb, path escaping, body and envelope handling on every native flow.
const id = "id/a?b#c";
const encoded = "id%2Fa%3Fb%23c";
const input = { operationId: "op-1", note: "private" };
type Method = keyof ReturnType<typeof createApiClient>;
const cases: [Method, unknown[], string, string, unknown?][] = [
  ["getAccountAccess", [], "GET", "/account-access"],
  ["acceptAccountConsents", [input], "POST", "/account-access", input],
  ["getRuntimeCapabilities", [], "GET", "/capabilities"],
  ["getEntitlements", [], "GET", "/entitlements"],
  ["getToday", [], "GET", "/today"],
  ["chooseRole", ["supporter"], "POST", "/role", { role: "supporter" }],
  ["completeOwnerOnboarding", [input], "POST", "/onboarding/owner", input],
  [
    "completeSupporterOnboarding",
    [input],
    "POST",
    "/onboarding/supporter",
    input,
  ],
  ["saveCheckIn", [input], "POST", "/check-in", input],
  ["getPeriods", [], "GET", "/periods"],
  [
    "startPeriod",
    ["2026-10-30"],
    "POST",
    "/periods/start",
    { date: "2026-10-30" },
  ],
  ["endPeriod", ["2026-10-30"], "POST", "/periods/end", { date: "2026-10-30" }],
  ["createInvite", [], "POST", "/couple/invite"],
  ["cancelInvite", [], "DELETE", "/couple/invite"],
  [
    "acceptInvite",
    ["ABCD-EFGH"],
    "POST",
    "/couple/accept",
    { code: "ABCD-EFGH" },
  ],
  ["updateSharing", [input], "PATCH", "/couple/sharing", input],
  ["pauseSharing", [48], "POST", "/couple/pause", { hours: 48 }],
  ["resumeSharing", [], "POST", "/couple/resume"],
  ["endLink", [], "DELETE", "/couple"],
  ["sendGesture", [input], "POST", "/gestures", input],
  ["thankGesture", [id], "POST", `/gestures/${encoded}/thanks`],
  ["completeLesson", [id], "POST", `/ally/${encoded}/complete`],
  ["registerDevice", [input], "POST", "/devices", input],
];
it.each(cases)(
  "transports %s with the session and encoded identifiers",
  async (method, args, verb, path, body) => {
    const fetcher = vi.fn<typeof fetch>(async () =>
      Response.json({ data: { result: "fixture" } }),
    );
    const client = createApiClient({
      baseUrl: "https://moodday.example",
      getHeaders: async () => ({ Authorization: "Bearer synthetic-test-only" }),
      fetchImplementation: fetcher,
    });
    const call = client[method] as (...args: unknown[]) => Promise<unknown>;
    expect(await call(...args)).toEqual({ result: "fixture" });
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(`https://moodday.example/api/v2${path}`);
    expect(options?.method ?? "GET").toBe(verb);
    expect(options?.headers).toMatchObject({
      Authorization: "Bearer synthetic-test-only",
      Accept: "application/json",
    });
    expect(options?.body).toBe(
      body === undefined ? undefined : JSON.stringify(body),
    );
  },
);
