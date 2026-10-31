import type {
  AccountAccessDto,
  AcceptAccountConsentsInput,
  AllyLessonDto,
  ApiError,
  CheckInDto,
  EntitlementDto,
  GestureDto,
  MooddayRole,
  OwnerOnboardingInput,
  RegisterDeviceInput,
  RuntimeCapabilitiesDto,
  SaveCheckInInput,
  SendGestureInput,
  SupporterOnboardingInput,
  TodayDto,
  UpdateSharingInput,
} from "@moodday/contracts";

export type PeriodDto = {
  id: string;
  startDate: string;
  endDate: string | null;
};

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
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const record =
      body !== null && typeof body === "object"
        ? (body as Record<string, unknown>)
        : undefined;

    if (!response.ok || !record || !("data" in record)) {
      const candidate = record?.error;
      const structured =
        candidate !== null &&
        typeof candidate === "object" &&
        "code" in candidate &&
        typeof candidate.code === "string" &&
        "message" in candidate &&
        typeof candidate.message === "string" &&
        "recoverable" in candidate &&
        typeof candidate.recoverable === "boolean" &&
        "requestId" in candidate &&
        typeof candidate.requestId === "string";
      const error =
        response.status === 401
          ? {
              code: "authentication_required",
              message: "Une connexion vérifiée est nécessaire.",
              recoverable: false,
              requestId: structured
                ? (candidate.requestId as string)
                : (response.headers.get("x-request-id") ?? "unknown"),
            }
          : structured
            ? (candidate as ApiError["error"])
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

    return record.data as T;
  };

  const post = async <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  return {
    getAccountAccess: async () =>
      request<AccountAccessDto>("/api/v2/account-access"),
    acceptAccountConsents: async (input: AcceptAccountConsentsInput) =>
      post<AccountAccessDto>("/api/v2/account-access", input),
    getRuntimeCapabilities: async () =>
      request<RuntimeCapabilitiesDto>("/api/v2/capabilities"),
    getEntitlements: async () =>
      request<EntitlementDto>("/api/v2/entitlements"),
    refreshMobileEntitlements: async () =>
      post<EntitlementDto>("/api/v2/entitlements/refresh"),
    getToday: async () => request<TodayDto>("/api/v2/today"),
    listGestures: async () => request<GestureDto[]>("/api/v2/gestures"),
    getLesson: async (slug: string) =>
      request<AllyLessonDto>(`/api/v2/ally/${encodeURIComponent(slug)}`),
    chooseRole: async (role: MooddayRole) =>
      post<{ role: MooddayRole }>("/api/v2/role", { role }),
    completeOwnerOnboarding: async (input: OwnerOnboardingInput) =>
      post<{ ok: true }>("/api/v2/onboarding/owner", input),
    completeSupporterOnboarding: async (input: SupporterOnboardingInput) =>
      post<{ ok: true }>("/api/v2/onboarding/supporter", input),
    saveCheckIn: async (input: SaveCheckInInput) =>
      post<CheckInDto>("/api/v2/check-in", input),
    getPeriods: async () => request<PeriodDto[]>("/api/v2/periods"),
    startPeriod: async (date: string) =>
      post<PeriodDto>("/api/v2/periods/start", { date }),
    endPeriod: async (date: string) =>
      post<PeriodDto>("/api/v2/periods/end", { date }),
    createInvite: async () =>
      post<{ code: string; expiresInDays: number }>("/api/v2/couple/invite"),
    cancelInvite: async () =>
      request<{ ok: true }>("/api/v2/couple/invite", { method: "DELETE" }),
    acceptInvite: async (code: string) =>
      post<{ linkId: string }>("/api/v2/couple/accept", { code }),
    updateSharing: async (input: UpdateSharingInput) =>
      request<{ ok: true }>("/api/v2/couple/sharing", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    pauseSharing: async (hours: 24 | 48 | 72) =>
      post<{ pausedUntil: string }>("/api/v2/couple/pause", { hours }),
    resumeSharing: async () => post<{ ok: true }>("/api/v2/couple/resume"),
    endLink: async () =>
      request<{ ok: true }>("/api/v2/couple", { method: "DELETE" }),
    sendGesture: async (input: SendGestureInput) =>
      post<GestureDto>("/api/v2/gestures", input),
    thankGesture: async (gestureId: string) =>
      post<{ ok: true }>(
        `/api/v2/gestures/${encodeURIComponent(gestureId)}/thanks`,
      ),
    completeLesson: async (slug: string) =>
      post<{ ok: true }>(`/api/v2/ally/${encodeURIComponent(slug)}/complete`),
    registerDevice: async (input: RegisterDeviceInput) =>
      post<{ ok: true }>("/api/v2/devices", input),
  };
};
