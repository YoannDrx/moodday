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

export const routineOccurrenceStatusSchema = z.enum([
  "planned",
  "completed",
  "skipped",
  "cancelled",
]);

export const routineOccurrenceWriteSchema = z
  .object({
    routineId: z.string().min(8).max(128),
    localDate: z.iso.date(),
    timezone: z.string().min(1).max(80),
    status: routineOccurrenceStatusSchema,
    completedAt: z.iso.datetime().nullable().optional(),
    note: z.string().trim().max(1_000).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.status === "completed" && !value.completedAt) {
      context.addIssue({
        code: "custom",
        path: ["completedAt"],
        message: "completed_at_required",
      });
    }
    if (value.status !== "completed" && value.completedAt) {
      context.addIssue({
        code: "custom",
        path: ["completedAt"],
        message: "completed_at_not_allowed",
      });
    }
  });

export const createRoutineOccurrenceSchema =
  routineOccurrenceWriteSchema.safeExtend({
    operationId: z.string().min(8).max(128),
    entityId: z.string().min(8).max(128),
  });

export const routineOccurrenceSchema = routineOccurrenceWriteSchema.safeExtend({
  id: z.string(),
  operationId: z.string().nullable(),
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

export const appointmentBriefShareDurationHoursSchema = z.union([
  z.literal(1),
  z.literal(24),
  z.literal(72),
  z.literal(168),
]);

export const appointmentBriefShareTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/);

export const createAppointmentBriefShareSchema = z.object({
  operationId: z.string().min(8).max(128),
  shareId: z.string().min(8).max(128),
  token: appointmentBriefShareTokenSchema,
  expiresInHours: appointmentBriefShareDurationHoursSchema.default(24),
});

export const appointmentBriefShareSchema = z.object({
  id: z.string(),
  briefId: z.string(),
  expiresAt: z.iso.datetime(),
  revokedAt: z.iso.datetime().nullable(),
  accessCount: z.number().int().nonnegative(),
  lastAccessedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const appointmentBriefShareResultSchema = z.object({
  share: appointmentBriefShareSchema,
  token: appointmentBriefShareTokenSchema,
});

export const resolveAppointmentBriefShareSchema = z.object({
  token: appointmentBriefShareTokenSchema,
});

export const sharedAppointmentBriefSchema = z.object({
  brief: appointmentBriefSchema,
  expiresAt: z.iso.datetime(),
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

export const calendarProviderSchema = z.enum(["google", "native"]);
export const calendarDetailLevelSchema = z.enum(["generic", "appointment"]);
export const calendarConnectionStatusSchema = z.enum([
  "active",
  "paused",
  "permission_denied",
  "revoked",
  "error",
]);
export const calendarEventSyncStateSchema = z.enum([
  "aligned",
  "conflict",
  "provider_deleted",
  "moodday_deleted",
]);

export const createGoogleCalendarConnectionSchema = z.object({
  operationId: z.string().min(8).max(128),
  connectionId: z.string().min(8).max(128),
  sourceConnectionId: z.string().min(8).max(128),
  timezone: z.string().min(1).max(80),
  displayName: z.string().trim().min(1).max(120).default("Mood Day"),
  detailLevel: calendarDetailLevelSchema.default("generic"),
});

export const updateCalendarConnectionSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  detailLevel: calendarDetailLevelSchema.optional(),
});

export const calendarConnectionSchema = z.object({
  id: z.string(),
  provider: calendarProviderSchema,
  status: calendarConnectionStatusSchema,
  displayName: z.string(),
  timezone: z.string(),
  detailLevel: calendarDetailLevelSchema,
  permissionScope: z.array(z.string()),
  lastSyncStartedAt: z.iso.datetime().nullable(),
  lastSyncCompletedAt: z.iso.datetime().nullable(),
  lastSyncErrorCode: z.string().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const calendarConflictSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  appointmentId: z.string().nullable(),
  externalEventId: z.string(),
  syncState: calendarEventSyncStateSchema,
  moodDay: z
    .object({
      title: z.string(),
      startsAt: z.iso.datetime(),
      endsAt: z.iso.datetime().nullable(),
      timezone: z.string(),
      location: z.string().nullable(),
      updatedAt: z.iso.datetime(),
    })
    .nullable(),
  google: z
    .object({
      title: z.string().nullable(),
      startsAt: z.iso.datetime().nullable(),
      endsAt: z.iso.datetime().nullable(),
      timezone: z.string().nullable(),
      location: z.string().nullable(),
      updatedAt: z.iso.datetime().nullable(),
      deletedAt: z.iso.datetime().nullable(),
    })
    .nullable(),
  detectedAt: z.iso.datetime().nullable(),
});

export const resolveCalendarConflictSchema = z.object({
  resolution: z.enum(["moodday", "google"]),
});

export const calendarSyncResultSchema = z.object({
  connectionId: z.string(),
  fullSync: z.boolean(),
  imported: z.number().int().nonnegative(),
  updatedFromGoogle: z.number().int().nonnegative(),
  pushedToGoogle: z.number().int().nonnegative(),
  conflicts: z.number().int().nonnegative(),
  completedAt: z.iso.datetime(),
});

export const runtimeCapabilitiesSchema = z.object({
  googleCalendar: z.boolean(),
  healthKit: z.boolean(),
  billing: z.boolean(),
  caregiverSharing: z.boolean(),
  pushNotifications: z.boolean(),
});

export const healthMetricSchema = z.enum([
  "sleep_duration_minutes",
  "step_count",
  "active_energy_kcal",
  "resting_heart_rate_bpm",
  "hrv_sdnn_ms",
  "workout_minutes",
]);

export const healthSourceStatusSchema = z.enum([
  "active",
  "paused",
  "permission_denied",
  "revoked",
  "error",
]);

export const healthPermissionSchema = healthMetricSchema;

export const connectHealthKitSchema = z.object({
  permissionScope: z.array(healthPermissionSchema).min(1).max(6),
});

export const updateHealthSourceSchema = z.object({
  status: z.enum(["active", "paused", "permission_denied", "error"]),
  permissionScope: z.array(healthPermissionSchema).min(1).max(6).optional(),
});

export const healthSourceConnectionSchema = z.object({
  id: z.string(),
  kind: z.literal("healthkit"),
  status: healthSourceStatusSchema,
  permissionScope: z.array(healthPermissionSchema),
  pausedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
  lastSyncedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const healthAggregateQualitySchema = z.enum([
  "complete",
  "partial",
  "estimated",
  "contested",
]);

export const healthAggregateWriteSchema = z
  .object({
    operationId: z.string().min(8).max(128),
    sourceConnectionId: z.string().min(8).max(128),
    metric: healthMetricSchema,
    value: z.number().finite().nonnegative().max(100_000_000),
    unit: z.string().trim().min(1).max(32),
    localDate: z.iso.date(),
    timezone: z.string().min(1).max(80),
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    coverage: z.number().min(0).max(1).nullable().optional(),
    quality: healthAggregateQualitySchema.default("complete"),
    algorithmVersion: z.string().trim().min(1).max(64),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Date(value.windowEnd) <= new Date(value.windowStart)) {
      context.addIssue({
        code: "custom",
        path: ["windowEnd"],
        message: "health_window_end_must_follow_start",
      });
    }
  });

export const importHealthAggregatesSchema = z.object({
  aggregates: z.array(healthAggregateWriteSchema).min(1).max(186),
});

export const healthAggregateSchema = healthAggregateWriteSchema.safeExtend({
  id: z.string(),
  provenance: z.literal("healthkit"),
  importedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const healthAggregateImportResultSchema = z.object({
  accepted: z.number().int().nonnegative(),
  sourceConnectionId: z.string(),
  lastSyncedAt: z.iso.datetime(),
});

export const safetyPlanContactSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    detail: z.string().trim().min(1).max(200),
  })
  .strict();

const safetyPlanItemSchema = z.string().trim().min(1).max(500);

export const safetyPlanWriteSchema = z
  .object({
    warningSigns: z.array(safetyPlanItemSchema).max(20),
    copingStrategies: z.array(safetyPlanItemSchema).max(20),
    safePlaces: z.array(safetyPlanItemSchema).max(20),
    trustedContacts: z.array(safetyPlanContactSchema).max(10),
    professionalContacts: z.array(safetyPlanContactSchema).max(10),
    markReviewed: z.boolean().default(false),
  })
  .strict();

export const safetyPlanSchema = safetyPlanWriteSchema
  .omit({ markReviewed: true })
  .extend({
    id: z.string(),
    lastReviewedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });

export const medicationFrequencySchema = z.enum([
  "daily",
  "twice_daily",
  "weekly",
  "prn",
]);

const medicationQuantitySchema = z.number().nonnegative().max(1_000_000);

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dosage: z.string(),
  frequency: medicationFrequencySchema,
  isPrn: z.boolean(),
  isArchived: z.boolean(),
  scheduleTimes: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)),
  weeklyDay: z.number().int().min(0).max(6).nullable(),
  startDate: z.iso.date().nullable(),
  endDate: z.iso.date().nullable(),
  stockQuantity: medicationQuantitySchema.nullable(),
  unitsPerDose: medicationQuantitySchema.nullable(),
  lowStockThreshold: medicationQuantitySchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const medicationWriteSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    dosage: z.string().trim().min(1).max(200),
    frequency: medicationFrequencySchema,
    scheduleTimes: z
      .array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/))
      .max(2),
    weeklyDay: z.number().int().min(0).max(6).nullable(),
    startDate: z.iso.date().nullable(),
    endDate: z.iso.date().nullable(),
    stockQuantity: medicationQuantitySchema.nullable(),
    unitsPerDose: z.number().positive().max(1_000_000).nullable(),
    lowStockThreshold: medicationQuantitySchema.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "end_date_before_start_date",
      });
    }
    const expectedTimes =
      value.frequency === "twice_daily" ? 2 : value.frequency === "prn" ? 0 : 1;
    if (value.scheduleTimes.length !== expectedTimes) {
      context.addIssue({
        code: "custom",
        path: ["scheduleTimes"],
        message: "invalid_schedule_time_count",
      });
    }
    if (value.frequency === "weekly" && value.weeklyDay === null) {
      context.addIssue({
        code: "custom",
        path: ["weeklyDay"],
        message: "weekly_day_required",
      });
    }
  });

export const createMedicationSchema = medicationWriteSchema.safeExtend({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
  localDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
});

export const updateMedicationSchema = medicationWriteSchema.safeExtend({
  operationId: z.string().min(8).max(128),
  medicationId: z.string().min(1).max(128),
  localDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
  reason: z.string().trim().min(1).max(500),
  baseVersion: z.iso.datetime(),
});

export const doseEventKindSchema = z.enum(["taken", "skipped", "prn"]);
export const effectiveDoseEventKindSchema = z.enum([
  "taken",
  "skipped",
  "prn",
  "cancelled",
]);

export const doseEventWriteSchema = z
  .object({
    medicationId: z.string().min(1).max(128),
    kind: doseEventKindSchema,
    localDate: z.iso.date(),
    timezone: z.string().min(1).max(80),
    occurredAt: z.iso.datetime(),
    doseIndex: z.number().int().min(0).max(12).nullable().optional(),
    note: z.string().trim().max(2_000).nullable().optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === "prn" && value.doseIndex != null) {
      context.addIssue({
        code: "custom",
        path: ["doseIndex"],
        message: "prn_dose_index_not_allowed",
      });
    }
    if (value.kind !== "prn" && value.doseIndex == null) {
      context.addIssue({
        code: "custom",
        path: ["doseIndex"],
        message: "scheduled_dose_index_required",
      });
    }
  });

export const createDoseEventSchema = doseEventWriteSchema.safeExtend({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
});

export const doseEventSchema = z.object({
  id: z.string(),
  operationId: z.string().nullable(),
  medicationId: z.string().min(1).max(128),
  kind: effectiveDoseEventKindSchema,
  localDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
  occurredAt: z.iso.datetime(),
  doseIndex: z.number().int().min(0).max(12).nullable(),
  note: z.string().nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  correctionCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const doseEventCorrectionWriteSchema = z
  .object({
    doseEventId: z.string().min(1).max(128),
    targetKind: effectiveDoseEventKindSchema,
    occurredAt: z.iso.datetime(),
    timezone: z.string().min(1).max(80),
    note: z.string().trim().max(2_000).nullable().optional(),
    reason: z.string().trim().min(1).max(500),
    baseVersion: z.iso.datetime(),
  })
  .strict();

export const createDoseEventCorrectionSchema =
  doseEventCorrectionWriteSchema.extend({
    operationId: z.string().min(8).max(128),
    entityId: z.string().min(8).max(128),
  });

export const doseEventCorrectionSchema = z.object({
  id: z.string(),
  doseEventId: z.string(),
  medicationId: z.string(),
  operationId: z.string(),
  previousKind: effectiveDoseEventKindSchema,
  targetKind: effectiveDoseEventKindSchema,
  previousOccurredAt: z.iso.datetime(),
  occurredAt: z.iso.datetime(),
  timezone: z.string(),
  previousNote: z.string().nullable(),
  note: z.string().nullable(),
  reason: z.string(),
  createdAt: z.iso.datetime(),
});

export const doseEventCorrectionResultSchema = z.object({
  event: doseEventSchema,
  correction: doseEventCorrectionSchema,
});

export const medicationInventoryReasonSchema = z.enum([
  "refill",
  "correction",
  "manual",
]);

export const medicationInventoryAdjustmentWriteSchema = z
  .object({
    medicationId: z.string().min(1).max(128),
    quantityDelta: z.number().min(-1_000_000).max(1_000_000),
    reason: medicationInventoryReasonSchema,
    occurredAt: z.iso.datetime(),
    note: z.string().trim().max(500).nullable().optional(),
    baseVersion: z.iso.datetime(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.quantityDelta === 0) {
      context.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "inventory_delta_must_not_be_zero",
      });
    }
    if (value.reason === "refill" && value.quantityDelta < 0) {
      context.addIssue({
        code: "custom",
        path: ["quantityDelta"],
        message: "refill_must_increase_stock",
      });
    }
  });

export const createMedicationInventoryAdjustmentSchema =
  medicationInventoryAdjustmentWriteSchema.safeExtend({
    operationId: z.string().min(8).max(128),
    entityId: z.string().min(8).max(128),
  });

export const medicationInventoryEventSchema = z.object({
  id: z.string(),
  medicationId: z.string(),
  doseEventId: z.string().nullable(),
  quantityDelta: z.number(),
  reason: z.enum(["refill", "intake", "correction", "manual"]),
  note: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
});

export const medicationInventoryAdjustmentResultSchema = z.object({
  medication: medicationSchema,
  inventoryEvent: medicationInventoryEventSchema,
});

export const medicationScheduleRevisionSchema = z.object({
  id: z.string(),
  effectiveDate: z.iso.date(),
  dosage: z.string(),
  frequency: medicationFrequencySchema,
  scheduleTimes: z.array(z.string()),
  weeklyDay: z.number().int().min(0).max(6).nullable(),
  unitsPerDose: medicationQuantitySchema.nullable(),
  reason: z.string().nullable(),
  createdAt: z.iso.datetime(),
});

export const medicationDosageHistorySchema = z.object({
  id: z.string(),
  dosage: z.string(),
  previousDosage: z.string().nullable(),
  reason: z.string().nullable(),
  changedAt: z.iso.datetime(),
});

export const medicationDetailSchema = z.object({
  medication: medicationSchema,
  doseEvents: z.array(doseEventSchema),
  corrections: z.array(doseEventCorrectionSchema),
  inventoryEvents: z.array(medicationInventoryEventSchema),
  scheduleRevisions: z.array(medicationScheduleRevisionSchema),
  dosageHistory: z.array(medicationDosageHistorySchema),
});

const timePreferenceSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const preferredTextScaleSchema = z.enum([
  "system",
  "large",
  "extra_large",
]);

export const syncedPreferencesWriteSchema = z.object({
  locale: z.enum(["fr", "en"]),
  timezone: z.string().min(1).max(80).nullable(),
  reducedMotion: z.boolean(),
  preferredTextScale: preferredTextScaleSchema,
  notificationsEnabled: z.boolean(),
  dailyCheckInReminder: z.boolean(),
  dailyCheckInTime: timePreferenceSchema,
  medicationReminders: z.boolean(),
  medicationReminderTime: timePreferenceSchema,
});

export const syncedPreferencesSchema = syncedPreferencesWriteSchema.extend({
  id: z.string(),
  updatedAt: z.iso.datetime(),
});

export const updateSyncedPreferencesSchema = z.object({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
  baseVersion: z.iso.datetime().nullable(),
  preferences: syncedPreferencesWriteSchema,
});

export const userDraftKindSchema = z.enum([
  "check_in",
  "appointment_preparation",
]);

export const userDraftWriteSchema = z.object({
  kind: userDraftKindSchema,
  contextKey: z.string().trim().min(1).max(128),
  content: z.record(z.string().trim().min(1).max(80), z.unknown()),
});

export const userDraftSchema = userDraftWriteSchema.extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const saveUserDraftSchema = z.object({
  operationId: z.string().min(8).max(128),
  entityId: z.string().min(8).max(128),
  baseVersion: z.iso.datetime().nullable(),
  draft: userDraftWriteSchema,
});

export const syncEntityTypeSchema = z.enum([
  "check_in",
  "medication",
  "dose_event",
  "dose_event_correction",
  "medication_inventory_event",
  "routine",
  "routine_occurrence",
  "appointment",
  "appointment_question",
  "appointment_event",
  "appointment_decision",
  "user_draft",
  "user_preferences",
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
export type RoutineOccurrenceStatus = z.infer<
  typeof routineOccurrenceStatusSchema
>;
export type RoutineOccurrenceWriteInput = z.infer<
  typeof routineOccurrenceWriteSchema
>;
export type CreateRoutineOccurrenceInput = z.infer<
  typeof createRoutineOccurrenceSchema
>;
export type RoutineOccurrenceDto = z.infer<typeof routineOccurrenceSchema>;
export type AppointmentWriteInput = z.infer<typeof appointmentWriteSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AppointmentDto = z.infer<typeof appointmentSchema>;
export type CalendarProvider = z.infer<typeof calendarProviderSchema>;
export type CalendarDetailLevel = z.infer<typeof calendarDetailLevelSchema>;
export type CreateGoogleCalendarConnectionInput = z.infer<
  typeof createGoogleCalendarConnectionSchema
>;
export type UpdateCalendarConnectionInput = z.infer<
  typeof updateCalendarConnectionSchema
>;
export type CalendarConnectionDto = z.infer<typeof calendarConnectionSchema>;
export type CalendarConflictDto = z.infer<typeof calendarConflictSchema>;
export type ResolveCalendarConflictInput = z.infer<
  typeof resolveCalendarConflictSchema
>;
export type CalendarSyncResult = z.infer<typeof calendarSyncResultSchema>;
export type RuntimeCapabilitiesDto = z.infer<typeof runtimeCapabilitiesSchema>;
export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type HealthPermission = z.infer<typeof healthPermissionSchema>;
export type HealthSourceStatus = z.infer<typeof healthSourceStatusSchema>;
export type ConnectHealthKitInput = z.infer<typeof connectHealthKitSchema>;
export type UpdateHealthSourceInput = z.infer<typeof updateHealthSourceSchema>;
export type HealthSourceConnectionDto = z.infer<
  typeof healthSourceConnectionSchema
>;
export type HealthAggregateQuality = z.infer<
  typeof healthAggregateQualitySchema
>;
export type HealthAggregateWriteInput = z.infer<
  typeof healthAggregateWriteSchema
>;
export type ImportHealthAggregatesInput = z.infer<
  typeof importHealthAggregatesSchema
>;
export type HealthAggregateDto = z.infer<typeof healthAggregateSchema>;
export type HealthAggregateImportResult = z.infer<
  typeof healthAggregateImportResultSchema
>;
export type SafetyPlanContact = z.infer<typeof safetyPlanContactSchema>;
export type SafetyPlanWriteInput = z.infer<typeof safetyPlanWriteSchema>;
export type SafetyPlanDto = z.infer<typeof safetyPlanSchema>;
export type MedicationFrequency = z.infer<typeof medicationFrequencySchema>;
export type MedicationDto = z.infer<typeof medicationSchema>;
export type MedicationWriteInput = z.infer<typeof medicationWriteSchema>;
export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;
export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;
export type DoseEventKind = z.infer<typeof doseEventKindSchema>;
export type EffectiveDoseEventKind = z.infer<
  typeof effectiveDoseEventKindSchema
>;
export type DoseEventWriteInput = z.infer<typeof doseEventWriteSchema>;
export type CreateDoseEventInput = z.infer<typeof createDoseEventSchema>;
export type DoseEventDto = z.infer<typeof doseEventSchema>;
export type DoseEventCorrectionWriteInput = z.infer<
  typeof doseEventCorrectionWriteSchema
>;
export type CreateDoseEventCorrectionInput = z.infer<
  typeof createDoseEventCorrectionSchema
>;
export type DoseEventCorrectionDto = z.infer<typeof doseEventCorrectionSchema>;
export type DoseEventCorrectionResult = z.infer<
  typeof doseEventCorrectionResultSchema
>;
export type MedicationInventoryReason = z.infer<
  typeof medicationInventoryReasonSchema
>;
export type MedicationInventoryAdjustmentWriteInput = z.infer<
  typeof medicationInventoryAdjustmentWriteSchema
>;
export type CreateMedicationInventoryAdjustmentInput = z.infer<
  typeof createMedicationInventoryAdjustmentSchema
>;
export type MedicationInventoryEventDto = z.infer<
  typeof medicationInventoryEventSchema
>;
export type MedicationInventoryAdjustmentResult = z.infer<
  typeof medicationInventoryAdjustmentResultSchema
>;
export type MedicationScheduleRevisionDto = z.infer<
  typeof medicationScheduleRevisionSchema
>;
export type MedicationDosageHistoryDto = z.infer<
  typeof medicationDosageHistorySchema
>;
export type MedicationDetailDto = z.infer<typeof medicationDetailSchema>;
export type PreferredTextScale = z.infer<typeof preferredTextScaleSchema>;
export type SyncedPreferencesWriteInput = z.infer<
  typeof syncedPreferencesWriteSchema
>;
export type SyncedPreferencesDto = z.infer<typeof syncedPreferencesSchema>;
export type UpdateSyncedPreferencesInput = z.infer<
  typeof updateSyncedPreferencesSchema
>;
export type UserDraftKind = z.infer<typeof userDraftKindSchema>;
export type UserDraftWriteInput = z.infer<typeof userDraftWriteSchema>;
export type UserDraftDto = z.infer<typeof userDraftSchema>;
export type SaveUserDraftInput = z.infer<typeof saveUserDraftSchema>;
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
export type AppointmentBriefShareDurationHours = z.infer<
  typeof appointmentBriefShareDurationHoursSchema
>;
export type CreateAppointmentBriefShareInput = z.infer<
  typeof createAppointmentBriefShareSchema
>;
export type AppointmentBriefShareDto = z.infer<
  typeof appointmentBriefShareSchema
>;
export type AppointmentBriefShareResult = z.infer<
  typeof appointmentBriefShareResultSchema
>;
export type ResolveAppointmentBriefShareInput = z.infer<
  typeof resolveAppointmentBriefShareSchema
>;
export type SharedAppointmentBriefDto = z.infer<
  typeof sharedAppointmentBriefSchema
>;
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
