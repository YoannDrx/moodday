import { z } from "zod";

export const checkInDepthSchema = z.enum(["presence", "quick", "complete"]);

const optionalScale = z.number().int().min(0).max(10).nullable().optional();

export const createCheckInSchema = z
  .object({
    operationId: z.string().min(8).max(128),
    depth: checkInDepthSchema,
    localDate: z.iso.date(),
    timezone: z.string().min(1).max(80),
    valence: optionalScale,
    activation: optionalScale,
    irritability: optionalScale,
    anxiety: optionalScale,
    contexts: z.array(z.string().trim().min(1).max(48)).max(12).default([]),
    note: z.string().trim().max(2_000).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.depth === "presence") return;

    for (const field of ["valence", "activation", "irritability"] as const) {
      if (value[field] == null) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "required_for_scored_check_in",
        });
      }
    }
  });

export const checkInSchema = createCheckInSchema.safeExtend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const routineStatusSchema = z.enum(["active", "paused", "archived"]);

export const routineWriteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000).nullable().optional(),
  schedule: z.record(z.string(), z.unknown()).nullable().optional(),
  weeklyTarget: z.number().int().min(1).max(99).nullable().optional(),
  status: routineStatusSchema.default("active"),
});

export const createRoutineSchema = routineWriteSchema.extend({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
});

export const routineSchema = routineWriteSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const appointmentStatusSchema = z.enum([
  "scheduled",
  "completed",
  "cancelled",
]);

export const appointmentSourceSchema = z.enum([
  "moodday",
  "google_calendar",
  "native_calendar",
]);

export const appointmentWriteSchema = z
  .object({
    clinicianId: z.string().min(1).max(128).nullable().optional(),
    title: z.string().trim().min(1).max(160),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime().nullable().optional(),
    timezone: z.string().min(1).max(80),
    location: z.string().trim().max(240).nullable().optional(),
    status: appointmentStatusSchema.default("scheduled"),
    source: appointmentSourceSchema.default("moodday"),
    preparationStatus: z
      .enum(["not_started", "in_progress", "ready", "reviewed"])
      .default("not_started"),
  })
  .superRefine((value, context) => {
    if (value.endsAt && new Date(value.endsAt) <= new Date(value.startsAt)) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "appointment_end_must_follow_start",
      });
    }
  });

export const createAppointmentSchema = appointmentWriteSchema.safeExtend({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
});

export const appointmentQuestionSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  operationId: z.string().nullable(),
  position: z.number().int().min(0),
  content: z.string(),
  privateNote: z.boolean(),
  answeredAt: z.iso.datetime().nullable(),
});

export const createAppointmentQuestionSchema = z.object({
  operationId: z.string().min(8).max(128),
  questionId: z.string().min(8).max(128),
  content: z.string().trim().min(1).max(1_000),
  privateNote: z.boolean().default(false),
  position: z.number().int().min(0).max(1_000).optional(),
});

export const appointmentEventTypeSchema = z.enum([
  "preparation_started",
  "question_added",
  "session_started",
  "session_ended",
  "debriefed",
  "follow_up_added",
]);

export const createAppointmentEventSchema = z.object({
  operationId: z.string().min(8).max(128),
  eventId: z.string().min(8).max(128),
  type: appointmentEventTypeSchema,
  occurredAt: z.iso.datetime(),
  payload: z
    .object({ summary: z.string().trim().min(1).max(500).optional() })
    .strict()
    .nullable()
    .optional(),
});

export const appointmentEventSchema = createAppointmentEventSchema
  .omit({ eventId: true })
  .extend({
    id: z.string(),
    appointmentId: z.string(),
    createdAt: z.iso.datetime(),
  });

export const appointmentDecisionStatusSchema = z.enum([
  "open",
  "completed",
  "dismissed",
]);

export const createAppointmentDecisionSchema = z.object({
  operationId: z.string().min(8).max(128),
  decisionId: z.string().min(8).max(128),
  summary: z.string().trim().min(1).max(500),
  status: appointmentDecisionStatusSchema.default("open"),
  includeInBrief: z.boolean().default(true),
  dueAt: z.iso.datetime().nullable().optional(),
});

export const appointmentDecisionSchema = createAppointmentDecisionSchema
  .omit({ decisionId: true })
  .extend({
    id: z.string(),
    appointmentId: z.string(),
    completedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });

export const createAppointmentBriefSchema = z
  .object({
    operationId: z.string().min(8).max(128),
    briefId: z.string().min(8).max(128),
    periodStart: z.iso.datetime().nullable().optional(),
    periodEnd: z.iso.datetime().nullable().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.periodStart &&
      value.periodEnd &&
      new Date(value.periodEnd) <= new Date(value.periodStart)
    ) {
      context.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "brief_period_end_must_follow_start",
      });
    }
  });

export const appointmentBriefContentSchema = z.object({
  appointment: z.object({
    title: z.string(),
    startsAt: z.iso.datetime(),
    timezone: z.string(),
    clinician: z.string().nullable(),
  }),
  questions: z.array(z.object({ content: z.string() })),
  decisions: z.array(
    z.object({
      summary: z.string(),
      status: appointmentDecisionStatusSchema,
      dueAt: z.iso.datetime().nullable(),
    }),
  ),
  generatedAt: z.iso.datetime(),
  excludedPrivateQuestionCount: z.number().int().min(0),
});

export const appointmentBriefSchema = z.object({
  id: z.string(),
  appointmentId: z.string(),
  operationId: z.string(),
  version: z.number().int().positive(),
  content: appointmentBriefContentSchema,
  privateNotesExcluded: z.literal(true),
  periodStart: z.iso.datetime().nullable(),
  periodEnd: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const createAppointmentArtifactSchema = z.discriminatedUnion("kind", [
  createAppointmentQuestionSchema.extend({ kind: z.literal("question") }),
  createAppointmentEventSchema.extend({ kind: z.literal("event") }),
  createAppointmentDecisionSchema.extend({ kind: z.literal("decision") }),
  createAppointmentBriefSchema.safeExtend({ kind: z.literal("brief") }),
]);

export const appointmentArtifactsSchema = z.object({
  questions: z.array(appointmentQuestionSchema),
  events: z.array(appointmentEventSchema),
  decisions: z.array(appointmentDecisionSchema),
  briefs: z.array(appointmentBriefSchema),
});

export const appointmentSchema = appointmentWriteSchema.safeExtend({
  id: z.string(),
  externalEventId: z.string().nullable(),
  externalVersion: z.string().nullable(),
  questions: z.array(appointmentQuestionSchema).default([]),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const syncEntityTypeSchema = z.enum([
  "check_in",
  "routine",
  "appointment",
  "appointment_question",
  "appointment_event",
  "appointment_decision",
]);

export const syncMutationSchema = z.enum(["create", "update", "delete"]);

export const syncPushOperationSchema = z.object({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
  entityType: syncEntityTypeSchema,
  mutation: syncMutationSchema,
  baseVersion: z.iso.datetime().nullable().optional(),
  payload: z.unknown(),
});

export const syncPushSchema = z.object({
  deviceId: z.string().min(8).max(128),
  platform: z.enum(["web", "ios", "android"]),
  operations: z.array(syncPushOperationSchema).min(1).max(50),
});

export const syncOperationResultSchema = z.object({
  operationId: z.string(),
  entityId: z.string(),
  status: z.enum(["applied", "duplicate", "conflict", "rejected"]),
  code: z.string().nullable(),
  currentVersion: z.iso.datetime().nullable(),
});

export const syncPushResultSchema = z.object({
  results: z.array(syncOperationResultSchema),
});

export const syncPullQuerySchema = z.object({
  cursor: z.string().max(1_024).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const syncChangeSchema = z.object({
  operationId: z.string(),
  entityId: z.string().nullable(),
  entityType: syncEntityTypeSchema,
  mutation: syncMutationSchema,
  changedAt: z.iso.datetime(),
  data: z.unknown().nullable(),
});

export const syncPullResultSchema = z.object({
  changes: z.array(syncChangeSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const todayQuerySchema = z.object({
  localDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
});

export const todaySchema = z.object({
  localDate: z.iso.date(),
  recommendedAction: z.enum([
    "check_in",
    "appointment_preparation",
    "routine",
    "none",
  ]),
  latestCheckIn: checkInSchema.nullable(),
  nextAppointment: z
    .object({
      id: z.string(),
      title: z.string(),
      startsAt: z.iso.datetime(),
      preparationStatus: z.string(),
    })
    .nullable(),
  routines: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      weeklyTarget: z.number().int().nullable(),
    }),
  ),
  sources: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      status: z.string(),
      lastSyncedAt: z.iso.datetime().nullable(),
    }),
  ),
});

export const sharePermissionSchema = z.enum([
  "mood_summary",
  "medication_adherence",
  "appointments",
  "support_requests",
  "caregiver_observations",
]);

export const createCircleInvitationSchema = z.object({
  operationId: z.string().min(8).max(128),
  relationshipId: z.string().min(8).max(128),
  invitationEmail: z.email().max(320),
  displayName: z.string().trim().min(1).max(100).nullable().optional(),
  permissions: z.array(sharePermissionSchema).min(1).max(5),
  durationDays: z.number().int().min(1).max(365),
});

export const acceptCircleInvitationSchema = z.object({
  invitationToken: z.string().min(32).max(512),
});

export const circleRelationshipSchema = z.object({
  id: z.string(),
  invitationEmail: z.email(),
  displayName: z.string().nullable(),
  caregiverId: z.string().nullable(),
  status: z.enum(["invited", "active", "declined", "expired", "revoked"]),
  permissions: z.array(sharePermissionSchema),
  expiresAt: z.iso.datetime(),
  acceptedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const circleInvitationResultSchema = z.object({
  relationship: circleRelationshipSchema,
  invitationToken: z.string(),
});

export const supportRequestKindSchema = z.enum([
  "call",
  "presence",
  "walk",
  "meal",
  "transport",
  "other",
]);

export const createSupportRequestSchema = z.object({
  operationId: z.string().min(8).max(128),
  relationshipId: z.string().min(8).max(128),
  kind: supportRequestKindSchema,
  message: z.string().trim().max(500).nullable().optional(),
  requestedFor: z.iso.datetime().nullable().optional(),
});

export const supportRequestSchema = createSupportRequestSchema
  .omit({ relationshipId: true })
  .extend({
    id: z.string(),
    relationshipId: z.string().nullable(),
    patientId: z.string(),
    caregiverId: z.string().nullable(),
    status: z.enum([
      "pending",
      "accepted",
      "declined",
      "cancelled",
      "completed",
    ]),
    respondedAt: z.iso.datetime().nullable(),
    completedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });

export const respondSupportRequestSchema = z.object({
  status: z.enum(["accepted", "declined", "completed"]),
});

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
  entitlement: z.literal("plus"),
  active: z.boolean(),
  sourceProviders: z.array(subscriptionProviderSchema),
  validUntil: z.iso.datetime().nullable(),
  duplicateSubscription: z.boolean(),
  manageWith: subscriptionProviderSchema.nullable(),
  calculatedAt: z.iso.datetime(),
});

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

export type CheckInDepth = z.infer<typeof checkInDepthSchema>;
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>;
export type CheckInDto = z.infer<typeof checkInSchema>;
export type RoutineStatus = z.infer<typeof routineStatusSchema>;
export type RoutineWriteInput = z.infer<typeof routineWriteSchema>;
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type RoutineDto = z.infer<typeof routineSchema>;
export type AppointmentWriteInput = z.infer<typeof appointmentWriteSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AppointmentDto = z.infer<typeof appointmentSchema>;
export type CreateAppointmentQuestionInput = z.infer<
  typeof createAppointmentQuestionSchema
>;
export type AppointmentQuestionDto = z.infer<typeof appointmentQuestionSchema>;
export type CreateAppointmentEventInput = z.infer<
  typeof createAppointmentEventSchema
>;
export type AppointmentEventDto = z.infer<typeof appointmentEventSchema>;
export type CreateAppointmentDecisionInput = z.infer<
  typeof createAppointmentDecisionSchema
>;
export type AppointmentDecisionDto = z.infer<typeof appointmentDecisionSchema>;
export type CreateAppointmentBriefInput = z.infer<
  typeof createAppointmentBriefSchema
>;
export type AppointmentBriefContent = z.infer<
  typeof appointmentBriefContentSchema
>;
export type AppointmentBriefDto = z.infer<typeof appointmentBriefSchema>;
export type CreateAppointmentArtifactInput = z.infer<
  typeof createAppointmentArtifactSchema
>;
export type AppointmentArtifactsDto = z.infer<
  typeof appointmentArtifactsSchema
>;
export type SyncEntityType = z.infer<typeof syncEntityTypeSchema>;
export type SyncMutation = z.infer<typeof syncMutationSchema>;
export type SyncPushOperation = z.infer<typeof syncPushOperationSchema>;
export type SyncPushInput = z.infer<typeof syncPushSchema>;
export type SyncOperationResult = z.infer<typeof syncOperationResultSchema>;
export type SyncPushResult = z.infer<typeof syncPushResultSchema>;
export type SyncPullResult = z.infer<typeof syncPullResultSchema>;
export type TodayDto = z.infer<typeof todaySchema>;
export type SharePermission = z.infer<typeof sharePermissionSchema>;
export type CreateCircleInvitationInput = z.infer<
  typeof createCircleInvitationSchema
>;
export type AcceptCircleInvitationInput = z.infer<
  typeof acceptCircleInvitationSchema
>;
export type CircleRelationshipDto = z.infer<typeof circleRelationshipSchema>;
export type CircleInvitationResult = z.infer<
  typeof circleInvitationResultSchema
>;
export type CreateSupportRequestInput = z.infer<
  typeof createSupportRequestSchema
>;
export type SupportRequestKind = z.infer<typeof supportRequestKindSchema>;
export type SupportRequestDto = z.infer<typeof supportRequestSchema>;
export type RespondSupportRequestInput = z.infer<
  typeof respondSupportRequestSchema
>;
export type SubscriptionProvider = z.infer<typeof subscriptionProviderSchema>;
export type SubscriptionSourceStatus = z.infer<
  typeof subscriptionSourceStatusSchema
>;
export type EntitlementDto = z.infer<typeof entitlementSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
