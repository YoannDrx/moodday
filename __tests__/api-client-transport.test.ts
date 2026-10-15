import { expect, it, vi } from "vitest";
import { createApiClient } from "../packages/api-client/src";

// Exercise the public transport contract independently of the server implementation:
// credentials, verb, path escaping, body and envelope handling on every native flow.
const id = "id/a?b#c";
const encoded = "id%2Fa%3Fb%23c";
const input = {
  operationId: "op-1",
  medicationId: id,
  doseEventId: id,
  note: "private",
};
type Method = keyof ReturnType<typeof createApiClient>;
const cases: [Method, unknown[], string, string, unknown?][] = [
  ["getAccountAccess", [], "GET", "/account-access"],
  ["acceptAccountConsents", [input], "POST", "/account-access", input],
  ["getRuntimeCapabilities", [], "GET", "/capabilities"],
  ["getSyncedPreferences", [], "GET", "/preferences"],
  [
    "getUserDraft",
    ["appointment_preparation", id],
    "GET",
    `/drafts?kind=appointment_preparation&contextKey=${encoded}`,
  ],
  ["createCheckIn", [input], "POST", "/check-ins", input],
  ["listCheckIns", [], "GET", "/check-ins"],
  ["listCheckIns", [id], "GET", `/check-ins?cursor=${encoded}`],
  ["listMedications", [], "GET", "/medications?includeArchived=false"],
  [
    "listMedications",
    [id, true],
    "GET",
    `/medications?includeArchived=true&cursor=${encoded}`,
  ],
  ["createMedication", [input], "POST", "/medications", input],
  ["updateMedication", [input], "PATCH", `/medications/${encoded}`, input],
  [
    "listDoseEvents",
    ["2026-10-02", "Europe/Paris"],
    "GET",
    "/dose-events?localDate=2026-10-02&timezone=Europe%2FParis",
  ],
  ["createDoseEvent", [input], "POST", "/dose-events", input],
  [
    "correctDoseEvent",
    [input],
    "POST",
    `/dose-events/${encoded}/corrections`,
    input,
  ],
  ["getMedicationDetail", [id], "GET", `/medications/${encoded}`],
  [
    "adjustMedicationInventory",
    [input],
    "POST",
    `/medications/${encoded}/inventory-events`,
    input,
  ],
  [
    "getToday",
    ["2026-10-02", "Europe/Paris"],
    "GET",
    "/today?localDate=2026-10-02&timezone=Europe%2FParis",
  ],
  ["createRoutine", [input], "POST", "/routines", input],
  ["listRoutines", [], "GET", "/routines"],
  ["listRoutines", [id], "GET", `/routines?cursor=${encoded}`],
  ["createRoutineOccurrence", [input], "POST", "/routine-occurrences", input],
  [
    "listRoutineOccurrences",
    [id],
    "GET",
    `/routine-occurrences?localDate=${encoded}`,
  ],
  ["createAppointment", [input], "POST", "/appointments", input],
  ["listAppointments", [], "GET", "/appointments"],
  ["listAppointments", [id], "GET", `/appointments?cursor=${encoded}`],
  ["listCalendarConnections", [], "GET", "/calendar-connections"],
  [
    "createGoogleCalendarConnection",
    [input],
    "POST",
    "/calendar-connections",
    input,
  ],
  [
    "updateCalendarConnection",
    [id, input],
    "PATCH",
    `/calendar-connections/${encoded}`,
    input,
  ],
  [
    "revokeCalendarConnection",
    [id],
    "DELETE",
    `/calendar-connections/${encoded}`,
  ],
  [
    "synchronizeGoogleCalendar",
    [id],
    "POST",
    `/calendar-connections/${encoded}/sync`,
  ],
  [
    "listCalendarConflicts",
    [id],
    "GET",
    `/calendar-connections/${encoded}/conflicts`,
  ],
  [
    "resolveCalendarConflict",
    [id, id, input],
    "POST",
    `/calendar-connections/${encoded}/conflicts/${encoded}`,
    input,
  ],
  [
    "listAppointmentArtifacts",
    [id],
    "GET",
    `/appointments/${encoded}/artifacts`,
  ],
  [
    "createAppointmentArtifact",
    [id, input],
    "POST",
    `/appointments/${encoded}/artifacts`,
    input,
  ],
  [
    "listAppointmentBriefShares",
    [id],
    "GET",
    `/appointment-briefs/${encoded}/shares`,
  ],
  [
    "createAppointmentBriefShare",
    [id, input],
    "POST",
    `/appointment-briefs/${encoded}/shares`,
    input,
  ],
  [
    "revokeAppointmentBriefShare",
    [id, id],
    "DELETE",
    `/appointment-briefs/${encoded}/shares/${encoded}`,
  ],
  [
    "resolveSharedAppointmentBrief",
    [id],
    "POST",
    "/shared-appointment-brief",
    { token: id },
  ],
  ["listCircleRelationships", [], "GET", "/circle"],
  ["createCircleInvitation", [input], "POST", "/circle", input],
  ["acceptCircleInvitation", [input], "POST", "/circle/accept", input],
  ["revokeCircleRelationship", [id], "DELETE", `/circle/${encoded}`],
  ["listSupportRequests", [], "GET", "/support-requests"],
  ["createSupportRequest", [input], "POST", "/support-requests", input],
  [
    "respondToSupportRequest",
    [id, input],
    "PATCH",
    `/support-requests/${encoded}`,
    input,
  ],
  ["getEntitlements", [], "GET", "/entitlements"],
  ["refreshMobileEntitlements", [], "POST", "/entitlements/refresh"],
  ["getHealthKitConnection", [], "GET", "/source-connections/healthkit"],
  ["connectHealthKit", [input], "POST", "/source-connections/healthkit", input],
  [
    "updateHealthKitConnection",
    [id, input],
    "PATCH",
    `/source-connections/healthkit/${encoded}`,
    input,
  ],
  [
    "revokeHealthKitConnection",
    [id],
    "DELETE",
    `/source-connections/healthkit/${encoded}`,
  ],
  ["importHealthAggregates", [input], "POST", "/health-aggregates", input],
  ["listHealthAggregates", ["a", "b"], "GET", "/health-aggregates?from=a&to=b"],
  [
    "listHealthAggregates",
    ["a", "b", id],
    "GET",
    `/health-aggregates?from=a&to=b&connectionId=${encoded}`,
  ],
  [
    "deleteHealthAggregates",
    [id],
    "DELETE",
    `/health-aggregates?connectionId=${encoded}`,
  ],
  [
    "deleteHealthAggregates",
    [id, { from: "a", to: "b" }],
    "DELETE",
    `/health-aggregates?connectionId=${encoded}&from=a&to=b`,
  ],
  ["getSafetyPlan", [], "GET", "/safety-plan"],
  ["saveSafetyPlan", [input], "PUT", "/safety-plan", input],
  ["pushSync", [input], "POST", "/sync/push", input],
  ["pullSync", [], "GET", "/sync/pull?limit=50"],
  ["pullSync", [id, 10], "GET", `/sync/pull?limit=10&cursor=${encoded}`],
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
