import type {
  AcceptCircleInvitationInput,
  ApiError,
  AppointmentDto,
  AppointmentArtifactsDto,
  AppointmentBriefDto,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
  CheckInDto,
  CircleInvitationResult,
  CircleRelationshipDto,
  CreateAppointmentInput,
  CreateAppointmentArtifactInput,
  CreateCheckInInput,
  CreateCircleInvitationInput,
  CreateRoutineInput,
  CreateRoutineOccurrenceInput,
  CreateSupportRequestInput,
  EntitlementDto,
  RespondSupportRequestInput,
  RoutineDto,
  RoutineOccurrenceDto,
  SupportRequestDto,
  SyncPullResult,
  SyncPushInput,
  SyncPushResult,
  TodayDto,
} from "@moodday/contracts";

type ApiClientOptions = {
  baseUrl: string;
  getHeaders?: () => Promise<Record<string, string>>;
  fetchImplementation?: typeof fetch;
  onAuthenticationRequired?: () => void;
};

export class MoodDayApiError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly requestId: string;

  constructor(error: ApiError["error"]) {
    super(error.message);
    this.name = "MoodDayApiError";
    this.code = error.code;
    this.recoverable = error.recoverable;
    this.requestId = error.requestId;
  }
}

export const createApiClient = ({
  baseUrl,
  getHeaders,
  fetchImplementation = fetch,
  onAuthenticationRequired,
}: ApiClientOptions) => {
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const authenticationHeaders = (await getHeaders?.()) ?? {};
    const response = await fetchImplementation(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authenticationHeaders,
        ...init?.headers,
      },
    });
    const body = (await response.json()) as
      | { data: T; requestId: string }
      | ApiError;

    if (!response.ok || !("data" in body)) {
      const error =
        "error" in body
          ? body.error
          : {
              code: "unexpected_response",
              message: "La réponse du serveur est invalide.",
              recoverable: true,
              requestId: response.headers.get("x-request-id") ?? "unknown",
            };
      const apiError = new MoodDayApiError(error);
      if (apiError.code === "authentication_required") {
        try {
          onAuthenticationRequired?.();
        } catch {
          // Session invalidation must never replace the structured API error.
        }
      }
      throw apiError;
    }

    return body.data;
  };

  return {
    createCheckIn: async (input: CreateCheckInInput) =>
      request<CheckInDto>("/api/v2/check-ins", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listCheckIns: async (cursor?: string) =>
      request<{ items: CheckInDto[]; nextCursor: string | null }>(
        `/api/v2/check-ins${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    getToday: async (localDate: string, timezone: string) =>
      request<TodayDto>(
        `/api/v2/today?localDate=${encodeURIComponent(localDate)}&timezone=${encodeURIComponent(timezone)}`,
      ),
    createRoutine: async (input: CreateRoutineInput) =>
      request<RoutineDto>("/api/v2/routines", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listRoutines: async (cursor?: string) =>
      request<{ items: RoutineDto[]; nextCursor: string | null }>(
        `/api/v2/routines${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    createRoutineOccurrence: async (input: CreateRoutineOccurrenceInput) =>
      request<RoutineOccurrenceDto>("/api/v2/routine-occurrences", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listRoutineOccurrences: async (localDate: string) =>
      request<RoutineOccurrenceDto[]>(
        `/api/v2/routine-occurrences?localDate=${encodeURIComponent(localDate)}`,
      ),
    createAppointment: async (input: CreateAppointmentInput) =>
      request<AppointmentDto>("/api/v2/appointments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listAppointments: async (cursor?: string) =>
      request<{ items: AppointmentDto[]; nextCursor: string | null }>(
        `/api/v2/appointments${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    listAppointmentArtifacts: async (appointmentId: string) =>
      request<AppointmentArtifactsDto>(
        `/api/v2/appointments/${encodeURIComponent(appointmentId)}/artifacts`,
      ),
    createAppointmentArtifact: async (
      appointmentId: string,
      input: CreateAppointmentArtifactInput,
    ) =>
      request<
        | AppointmentQuestionDto
        | AppointmentEventDto
        | AppointmentDecisionDto
        | AppointmentBriefDto
      >(`/api/v2/appointments/${encodeURIComponent(appointmentId)}/artifacts`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listCircleRelationships: async () =>
      request<CircleRelationshipDto[]>("/api/v2/circle"),
    createCircleInvitation: async (input: CreateCircleInvitationInput) =>
      request<CircleInvitationResult>("/api/v2/circle", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    acceptCircleInvitation: async (input: AcceptCircleInvitationInput) =>
      request<CircleRelationshipDto>("/api/v2/circle/accept", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    revokeCircleRelationship: async (relationshipId: string) =>
      request<{ revoked: boolean }>(
        `/api/v2/circle/${encodeURIComponent(relationshipId)}`,
        { method: "DELETE" },
      ),
    listSupportRequests: async () =>
      request<SupportRequestDto[]>("/api/v2/support-requests"),
    createSupportRequest: async (input: CreateSupportRequestInput) =>
      request<SupportRequestDto>("/api/v2/support-requests", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    respondToSupportRequest: async (
      supportRequestId: string,
      input: RespondSupportRequestInput,
    ) =>
      request<SupportRequestDto>(
        `/api/v2/support-requests/${encodeURIComponent(supportRequestId)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    getEntitlements: async () =>
      request<EntitlementDto>("/api/v2/entitlements"),
    pushSync: async (input: SyncPushInput) =>
      request<SyncPushResult>("/api/v2/sync/push", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    pullSync: async (cursor?: string, limit = 50) =>
      request<SyncPullResult>(
        `/api/v2/sync/pull?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
  };
};
