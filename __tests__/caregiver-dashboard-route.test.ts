import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  availability: vi.fn(),
  patients: vi.fn(),
  caregivers: vi.fn(),
  summary: vi.fn(),
  activity: vi.fn(),
  access: vi.fn(),
  preferences: vi.fn(),
}));
vi.mock("@/lib/auth/auth-user", () => ({ getAuthorizedApiUser: mocks.user }));
vi.mock("@/features/v2/circle/availability", () => ({
  getCircleAvailabilityError: mocks.availability,
}));
vi.mock("@/features/caregiver/caregiver.action", () => ({
  getMyPatients: mocks.patients,
  getMyCaregivers: mocks.caregivers,
  getCaregiverSummary: mocks.summary,
  getCaregiverActivity: mocks.activity,
  getCaregiverAccessLog: mocks.access,
  getCaregiverDigestPreferences: mocks.preferences,
}));
import { GET } from "@app/api/caregiver/dashboard/route";
const read = async (query: string) =>
  GET(new Request(`https://moodday.example/api/caregiver/dashboard?${query}`), {
    params: Promise.resolve({}),
  });

describe("caregiver read transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user.mockResolvedValue({ id: "owner" });
    mocks.availability.mockReturnValue(null);
    for (const key of [
      "patients",
      "caregivers",
      "summary",
      "activity",
      "access",
      "preferences",
    ] as const) {
      mocks[key].mockResolvedValue({ data: [] });
    }
  });
  it.each([
    "patients",
    "caregivers",
    "summary",
    "activity",
    "access",
    "preferences",
  ] as const)(
    "reads %s through its existing authorized service",
    async (resource) => {
      const response = await read(`resource=${resource}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toMatchObject({ data: [] });
      expect(mocks[resource]).toHaveBeenCalledTimes(1);
    },
  );
  it("rejects missing/invalid identity before reading any shared data", async () => {
    mocks.user.mockResolvedValue(null);
    const response = await read("resource=patients");
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.patients).not.toHaveBeenCalled();
  });
  it("never accepts a mutation or owner override", async () => {
    expect((await read("resource=inviteCaregiver")).status).toBe(400);
    expect((await read("resource=patients&userId=another-owner")).status).toBe(
      400,
    );
    expect(mocks.patients).not.toHaveBeenCalled();
  });
  it("keeps relationship authorization in the shared service and does not fall back on failure", async () => {
    mocks.activity.mockResolvedValue({
      serverError: "access denied",
      data: [{ notes: "must never escape" }],
    });
    const response = await read("resource=activity&relationshipId=revoked");
    expect(mocks.activity).toHaveBeenCalledWith({
      scope: { kind: "relationship", relationshipId: "revoked" },
      days: 30,
      limit: 10,
    });
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("must never escape");
  });
  it("keeps the feature gate closed", async () => {
    mocks.availability.mockReturnValue(
      new Response("unavailable", { status: 503 }),
    );
    expect((await read("resource=patients")).status).toBe(503);
    expect(mocks.patients).not.toHaveBeenCalled();
  });
});
