import type {
  AcceptCircleInvitationInput,
  ApiError,
  AppointmentDto,
  AppointmentArtifactsDto,
  AppointmentBriefDto,
  AppointmentBriefShareDto,
  AppointmentBriefShareResult,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
  CalendarConflictDto,
  CalendarConnectionDto,
  CalendarSyncResult,
  CheckInDto,
  CircleInvitationResult,
  CircleRelationshipDto,
  CreateAppointmentInput,
  CreateAppointmentArtifactInput,
  CreateAppointmentBriefShareInput,
  CreateCheckInInput,
  CreateCircleInvitationInput,
  CreateGoogleCalendarConnectionInput,
  CreateDoseEventInput,
  CreateDoseEventCorrectionInput,
  CreateMedicationInventoryAdjustmentInput,
  CreateMedicationInput,
  CreateRoutineInput,
  CreateRoutineOccurrenceInput,
  CreateSupportRequestInput,
  EntitlementDto,
  ConnectHealthKitInput,
  HealthAggregateDto,
  HealthAggregateImportResult,
  HealthSourceConnectionDto,
  ImportHealthAggregatesInput,
  UpdateHealthSourceInput,
  DoseEventDto,
  DoseEventCorrectionResult,
  MedicationDto,
  MedicationDetailDto,
  MedicationInventoryAdjustmentResult,
  RespondSupportRequestInput,
  ResolveCalendarConflictInput,
  RoutineDto,
  RoutineOccurrenceDto,
  RuntimeCapabilitiesDto,
  SafetyPlanDto,
  SafetyPlanWriteInput,
  SyncedPreferencesDto,
  SupportRequestDto,
  UpdateCalendarConnectionInput,
  UpdateMedicationInput,
  SharedAppointmentBriefDto,
  SyncPullResult,
  SyncPushInput,
  SyncPushResult,
  TodayDto,
  UserDraftDto,
  UserDraftKind,
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
    getRuntimeCapabilities: async () =>
      request<RuntimeCapabilitiesDto>("/api/v2/capabilities"),
    getSyncedPreferences: async () =>
      request<SyncedPreferencesDto | null>("/api/v2/preferences"),
    getUserDraft: async (kind: UserDraftKind, contextKey: string) =>
      request<UserDraftDto | null>(
        `/api/v2/drafts?kind=${encodeURIComponent(kind)}&contextKey=${encodeURIComponent(contextKey)}`,
      ),
    createCheckIn: async (input: CreateCheckInInput) =>
      request<CheckInDto>("/api/v2/check-ins", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listCheckIns: async (cursor?: string) =>
      request<{ items: CheckInDto[]; nextCursor: string | null }>(
        `/api/v2/check-ins${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    listMedications: async (cursor?: string, includeArchived = false) =>
      request<{ items: MedicationDto[]; nextCursor: string | null }>(
        `/api/v2/medications?includeArchived=${includeArchived}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
      ),
    createMedication: async (input: CreateMedicationInput) =>
      request<MedicationDto>("/api/v2/medications", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateMedication: async (input: UpdateMedicationInput) =>
      request<MedicationDto>(
        `/api/v2/medications/${encodeURIComponent(input.medicationId)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    listDoseEvents: async (localDate: string, timezone: string) =>
      request<DoseEventDto[]>(
        `/api/v2/dose-events?localDate=${encodeURIComponent(localDate)}&timezone=${encodeURIComponent(timezone)}`,
      ),
    createDoseEvent: async (input: CreateDoseEventInput) =>
      request<DoseEventDto>("/api/v2/dose-events", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    correctDoseEvent: async (input: CreateDoseEventCorrectionInput) =>
      request<DoseEventCorrectionResult>(
        `/api/v2/dose-events/${encodeURIComponent(input.doseEventId)}/corrections`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    getMedicationDetail: async (medicationId: string) =>
      request<MedicationDetailDto>(
        `/api/v2/medications/${encodeURIComponent(medicationId)}`,
      ),
    adjustMedicationInventory: async (
      input: CreateMedicationInventoryAdjustmentInput,
    ) =>
      request<MedicationInventoryAdjustmentResult>(
        `/api/v2/medications/${encodeURIComponent(input.medicationId)}/inventory-events`,
        { method: "POST", body: JSON.stringify(input) },
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
    listCalendarConnections: async () =>
      request<CalendarConnectionDto[]>("/api/v2/calendar-connections"),
    createGoogleCalendarConnection: async (
      input: CreateGoogleCalendarConnectionInput,
    ) =>
      request<CalendarConnectionDto>("/api/v2/calendar-connections", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    updateCalendarConnection: async (
      connectionId: string,
      input: UpdateCalendarConnectionInput,
    ) =>
      request<CalendarConnectionDto>(
        `/api/v2/calendar-connections/${encodeURIComponent(connectionId)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    revokeCalendarConnection: async (connectionId: string) =>
      request<{ revoked: boolean }>(
        `/api/v2/calendar-connections/${encodeURIComponent(connectionId)}`,
        { method: "DELETE" },
      ),
    synchronizeGoogleCalendar: async (connectionId: string) =>
      request<CalendarSyncResult>(
        `/api/v2/calendar-connections/${encodeURIComponent(connectionId)}/sync`,
        { method: "POST" },
      ),
    listCalendarConflicts: async (connectionId: string) =>
      request<CalendarConflictDto[]>(
        `/api/v2/calendar-connections/${encodeURIComponent(connectionId)}/conflicts`,
      ),
    resolveCalendarConflict: async (
      connectionId: string,
      conflictId: string,
      input: ResolveCalendarConflictInput,
    ) =>
      request<{ conflict: CalendarConflictDto; resolved: boolean }>(
        `/api/v2/calendar-connections/${encodeURIComponent(connectionId)}/conflicts/${encodeURIComponent(conflictId)}`,
        { method: "POST", body: JSON.stringify(input) },
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
    listAppointmentBriefShares: async (briefId: string) =>
      request<AppointmentBriefShareDto[]>(
        `/api/v2/appointment-briefs/${encodeURIComponent(briefId)}/shares`,
      ),
    createAppointmentBriefShare: async (
      briefId: string,
      input: CreateAppointmentBriefShareInput,
    ) =>
      request<AppointmentBriefShareResult>(
        `/api/v2/appointment-briefs/${encodeURIComponent(briefId)}/shares`,
        { method: "POST", body: JSON.stringify(input) },
      ),
    revokeAppointmentBriefShare: async (briefId: string, shareId: string) =>
      request<{ revoked: boolean }>(
        `/api/v2/appointment-briefs/${encodeURIComponent(briefId)}/shares/${encodeURIComponent(shareId)}`,
        { method: "DELETE" },
      ),
    resolveSharedAppointmentBrief: async (token: string) =>
      request<SharedAppointmentBriefDto>("/api/v2/shared-appointment-brief", {
        method: "POST",
        body: JSON.stringify({ token }),
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
    refreshMobileEntitlements: async () =>
      request<EntitlementDto>("/api/v2/entitlements/refresh", {
        method: "POST",
      }),
    getHealthKitConnection: async () =>
      request<HealthSourceConnectionDto | null>(
        "/api/v2/source-connections/healthkit",
      ),
    connectHealthKit: async (input: ConnectHealthKitInput) =>
      request<HealthSourceConnectionDto>(
        "/api/v2/source-connections/healthkit",
        { method: "POST", body: JSON.stringify(input) },
      ),
    updateHealthKitConnection: async (
      connectionId: string,
      input: UpdateHealthSourceInput,
    ) =>
      request<HealthSourceConnectionDto>(
        `/api/v2/source-connections/healthkit/${encodeURIComponent(connectionId)}`,
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    revokeHealthKitConnection: async (connectionId: string) =>
      request<{
        source: HealthSourceConnectionDto;
        deletedAggregates: number;
      }>(
        `/api/v2/source-connections/healthkit/${encodeURIComponent(connectionId)}`,
        { method: "DELETE" },
      ),
    importHealthAggregates: async (input: ImportHealthAggregatesInput) =>
      request<HealthAggregateImportResult>("/api/v2/health-aggregates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    listHealthAggregates: async (
      from: string,
      to: string,
      connectionId?: string,
    ) =>
      request<HealthAggregateDto[]>(
        `/api/v2/health-aggregates?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${connectionId ? `&connectionId=${encodeURIComponent(connectionId)}` : ""}`,
      ),
    deleteHealthAggregates: async (
      connectionId: string,
      period?: { from?: string; to?: string },
    ) => {
      const query = new URLSearchParams({ connectionId });
      if (period?.from) query.set("from", period.from);
      if (period?.to) query.set("to", period.to);
      return request<{ deleted: number }>(
        `/api/v2/health-aggregates?${query.toString()}`,
        { method: "DELETE" },
      );
    },
    getSafetyPlan: async () =>
      request<SafetyPlanDto | null>("/api/v2/safety-plan"),
    saveSafetyPlan: async (input: SafetyPlanWriteInput) =>
      request<SafetyPlanDto>("/api/v2/safety-plan", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
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
