import type {
  getCaregiverAccessLog,
  getCaregiverActivity,
  getCaregiverDigestPreferences,
  getCaregiverSummary,
  getMyCaregivers,
  getMyPatients,
} from "./caregiver.action";

type Result<T> = T extends { data?: infer Data } ? NonNullable<Data> : never;
export type CaregiverDashboardData = {
  patients: Result<Awaited<ReturnType<typeof getMyPatients>>>;
  caregivers: Result<Awaited<ReturnType<typeof getMyCaregivers>>>;
  summary: Result<Awaited<ReturnType<typeof getCaregiverSummary>>>;
  activity: Result<Awaited<ReturnType<typeof getCaregiverActivity>>>;
  access: Result<Awaited<ReturnType<typeof getCaregiverAccessLog>>>;
  preferences: Result<
    Awaited<ReturnType<typeof getCaregiverDigestPreferences>>
  >;
};

/** Read requests must not queue behind/in front of interactive Server Actions. */
export async function readCaregiverDashboard<
  K extends keyof CaregiverDashboardData,
>(
  resource: K,
  scope?:
    | { kind: "patient" }
    | { kind: "relationship"; relationshipId: string },
  signal?: AbortSignal,
): Promise<CaregiverDashboardData[K]> {
  const query = new URLSearchParams({ resource });
  if (scope?.kind === "relationship")
    query.set("relationshipId", scope.relationshipId);
  const response = await fetch(`/api/caregiver/dashboard?${query}`, {
    cache: "no-store",
    credentials: "same-origin",
    signal,
  });
  if (!response.ok) throw new Error("common.actionFailed");
  const result = (await response.json()) as {
    data?: CaregiverDashboardData[K] | null;
  };
  if (result.data === undefined || result.data === null)
    throw new Error("common.actionFailed");
  return result.data;
}
