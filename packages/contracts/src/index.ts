import { z } from "zod";

// ─── Account access ───────────────────────────────────────────────────────

export const requiredConsentVersionsSchema = z.object({
  terms: z.string().min(1),
  privacy: z.string().min(1),
  healthData: z.string().min(1),
  minimumAge: z.literal(18),
  country: z.literal("FR"),
});
export const accountAccessSchema = z.object({
  emailVerified: z.boolean(),
  consentsAccepted: z.boolean(),
  versions: requiredConsentVersionsSchema,
});
export const acceptAccountConsentsSchema = z.object({
  age18Accepted: z.literal(true),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  healthDataConsentAccepted: z.literal(true),
  locale: z.enum(["fr", "en"]),
  versions: requiredConsentVersionsSchema,
});
export type AccountAccessDto = z.infer<typeof accountAccessSchema>;
export type AcceptAccountConsentsInput = z.infer<
  typeof acceptAccountConsentsSchema
>;

// ─── Shared primitives ────────────────────────────────────────────────────

const operationId = z.string().min(8).max(128);
const civilDate = z.iso.date();
const catalogKey = z.string().trim().min(1).max(64);

export const mooddayRoleSchema = z.enum(["cycle_owner", "supporter"]);
export const checkInStateSchema = z.enum([
  "ok",
  "fragile",
  "hard",
  "very_hard",
]);
export const sharingLevelSchema = z.enum([
  "cycle_only",
  "cycle_state",
  "cycle_state_needs",
]);

export type MooddayRole = z.infer<typeof mooddayRoleSchema>;
export type CheckInState = z.infer<typeof checkInStateSchema>;
export type SharingLevel = z.infer<typeof sharingLevelSchema>;

// ─── Onboarding ───────────────────────────────────────────────────────────

export const chooseRoleSchema = z.object({ role: mooddayRoleSchema });

export const ownerOnboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  lastPeriodStart: civilDate.nullable(),
  typicalCycleLength: z.number().int().min(21).max(45).nullable(),
  typicalPeriodLength: z.number().int().min(2).max(10).nullable(),
  hardestThings: z.array(catalogKey).max(6),
  usualNeeds: z.array(catalogKey).max(6),
});

export const supporterOnboardingSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  supporterFocus: z.array(catalogKey).min(1).max(3),
});

export type OwnerOnboardingInput = z.infer<typeof ownerOnboardingSchema>;
export type SupporterOnboardingInput = z.infer<
  typeof supporterOnboardingSchema
>;

// ─── Check-in ("Mon point") and cycle ─────────────────────────────────────

export const saveCheckInSchema = z.object({
  operationId,
  localDate: civilDate,
  timezone: z.string().min(1).max(80),
  state: checkInStateSchema,
  symptoms: z.array(catalogKey).max(6).default([]),
  needs: z.array(catalogKey).max(3).default([]),
  privateNote: z.string().trim().max(1_000).nullable().optional(),
});
export type SaveCheckInInput = z.infer<typeof saveCheckInSchema>;

export const checkInSchema = z.object({
  id: z.string(),
  localDate: civilDate,
  state: checkInStateSchema,
  symptoms: z.array(z.string()),
  needs: z.array(z.string()),
  privateNote: z.string().nullable(),
  updatedAt: z.iso.datetime(),
});
export type CheckInDto = z.infer<typeof checkInSchema>;

export const periodDateSchema = z.object({ date: civilDate });
export const periodIdSchema = z.object({ periodId: z.string().min(1) });
export const updatePeriodSchema = z
  .object({
    periodId: z.string().min(1),
    startDate: civilDate,
    endDate: civilDate.nullable(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.startDate, {
    message: "end_before_start",
    path: ["endDate"],
  });

export const customNeedSchema = z.object({
  label: z.string().trim().min(2).max(48),
});

// ─── Couple link ──────────────────────────────────────────────────────────

export const inviteCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/u, "invalid_code")
  .transform((code) => code.replace("-", ""));

export const acceptInviteSchema = z.object({ code: inviteCodeSchema });

export const updateSharingSchema = z.object({
  level: sharingLevelSchema,
  shareSymptoms: z.boolean(),
  detailedPreviews: z.boolean(),
});
export type UpdateSharingInput = z.infer<typeof updateSharingSchema>;

export const pauseSharingSchema = z.object({
  hours: z.union([z.literal(24), z.literal(48), z.literal(72)]),
});

// ─── Gestures ─────────────────────────────────────────────────────────────

export const sendGestureSchema = z
  .object({
    operationId,
    checkInId: z.string().min(1).nullable(),
    kind: catalogKey,
    message: z.string().trim().max(140).nullable().optional(),
  })
  .refine((value) => value.kind !== "custom" || Boolean(value.message), {
    message: "custom_gesture_requires_message",
    path: ["message"],
  });
export type SendGestureInput = z.infer<typeof sendGestureSchema>;

export const gestureIdSchema = z.object({ gestureId: z.string().min(1) });

export const gestureSchema = z.object({
  id: z.string(),
  kind: z.string(),
  label: z.string(),
  message: z.string().nullable(),
  status: z.enum(["sent", "seen", "thanked"]),
  fromMe: z.boolean(),
  createdAt: z.iso.datetime(),
});
export type GestureDto = z.infer<typeof gestureSchema>;

// ─── Ally programme ───────────────────────────────────────────────────────

export const completeLessonSchema = z.object({
  slug: z.string().min(1).max(80),
});

export const allyLessonSchema = z.object({
  slug: z.string(),
  day: z.number().int(),
  title: z.string(),
  body: z.string(),
  tryThis: z.string(),
  quizQuestion: z.string(),
  quizOptions: z.array(z.string()),
  quizAnswer: z.number().int(),
  completed: z.boolean(),
});
export type AllyLessonDto = z.infer<typeof allyLessonSchema>;

// ─── Devices ──────────────────────────────────────────────────────────────

export const registerDeviceSchema = z.object({
  publicId: z.string().min(8).max(128),
  platform: z.enum(["ios", "android", "web"]),
  displayName: z.string().max(80).nullable().optional(),
  pushToken: z.string().min(10).max(512).nullable(),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

// ─── Today (mobile) ───────────────────────────────────────────────────────

export const cycleSnapshotSchema = z.object({
  phase: z.enum(["period", "between", "before", "late", "unknown"]),
  phaseTitle: z.string(),
  cycleDay: z.number().int().nullable(),
  daysUntilNextPeriod: z.number().int().nullable(),
  nextPeriodStart: civilDate.nullable(),
  periodOngoing: z.boolean(),
  confidence: z.enum(["none", "low", "medium", "high"]),
  pmsInsight: z.string().nullable(),
});

export const partnerTodaySchema = z.object({
  status: z.enum(["active", "paused"]),
  ownerName: z.string(),
  pausedUntil: z.iso.datetime().nullable(),
  phase: z.enum(["period", "between", "before", "late", "unknown"]).nullable(),
  phaseText: z.string().nullable(),
  daysUntilNextPeriod: z.number().int().nullable(),
  today: z
    .object({
      checkInId: z.string(),
      state: checkInStateSchema,
      stateLabel: z.string(),
      sharedAt: z.iso.datetime(),
      needs: z.array(z.object({ key: z.string(), label: z.string() })),
      symptoms: z.array(z.string()),
      avoid: z.array(z.string()),
      suggestions: z.array(z.object({ key: z.string(), label: z.string() })),
    })
    .nullable(),
  checkedInPrivately: z.boolean(),
});
export type PartnerTodayDto = z.infer<typeof partnerTodaySchema>;

export const todaySchema = z.object({
  role: mooddayRoleSchema.nullable(),
  onboarded: z.boolean(),
  displayName: z.string().nullable(),
  localDate: civilDate,
  link: z
    .object({
      status: z.enum(["invited", "active"]),
      partnerName: z.string().nullable(),
      level: sharingLevelSchema,
      shareSymptoms: z.boolean(),
      detailedPreviews: z.boolean(),
      pausedUntil: z.iso.datetime().nullable(),
    })
    .nullable(),
  owner: z
    .object({
      checkIn: checkInSchema.nullable(),
      cycle: cycleSnapshotSchema,
      gestures: z.array(gestureSchema),
      customNeeds: z.array(z.object({ id: z.string(), label: z.string() })),
    })
    .nullable(),
  supporter: z
    .object({
      partner: partnerTodaySchema.nullable(),
      gestures: z.array(gestureSchema),
      nextLesson: z
        .object({ slug: z.string(), day: z.number(), title: z.string() })
        .nullable(),
      completedLessons: z.number().int(),
    })
    .nullable(),
});
export type TodayDto = z.infer<typeof todaySchema>;

// ─── Billing ──────────────────────────────────────────────────────────────

export const subscriptionProviderSchema = z.enum([
  "stripe",
  "app_store",
  "play_store",
]);

export const subscriptionSourceStatusSchema = z.enum([
  "active",
  "trialing",
  "grace",
  "paused",
  "expired",
  "refunded",
]);

export const entitlementSchema = z.object({
  entitlement: z.literal("duo"),
  active: z.boolean(),
  sourceProviders: z.array(subscriptionProviderSchema),
  validUntil: z.iso.datetime().nullable(),
  duplicateSubscription: z.boolean(),
  manageWith: subscriptionProviderSchema.nullable(),
  calculatedAt: z.iso.datetime(),
});

// ─── API envelope ─────────────────────────────────────────────────────────

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    recoverable: z.boolean(),
    requestId: z.string(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});

export const apiSuccessSchema = <T extends z.ZodType>(data: T) =>
  z.object({ data, requestId: z.string() });

export const runtimeCapabilitiesSchema = z.object({
  billing: z.boolean(),
  pushNotifications: z.boolean(),
  coupleSharing: z.boolean(),
});

export type RuntimeCapabilitiesDto = z.infer<typeof runtimeCapabilitiesSchema>;
export type SubscriptionProvider = z.infer<typeof subscriptionProviderSchema>;
export type SubscriptionSourceStatus = z.infer<
  typeof subscriptionSourceStatusSchema
>;
export type EntitlementDto = z.infer<typeof entitlementSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
