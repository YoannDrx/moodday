export const moodDayV2OpenApi = {
  openapi: "3.1.0",
  info: {
    title: "Mood Day V2 API",
    version: "2.0.0-alpha.1",
    description:
      "Versioned contracts shared by Mood Day web, iOS and Android clients.",
  },
  servers: [{ url: "/api/v2" }],
  security: [{ cookieAuth: [] }],
  paths: {
    "/today": {
      get: {
        operationId: "getToday",
        parameters: [
          {
            name: "localDate",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
          },
          {
            name: "timezone",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Today state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TodayResponse" },
              },
            },
          },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/check-ins": {
      get: {
        operationId: "listCheckIns",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Cursor page of check-ins" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
      post: {
        operationId: "createCheckIn",
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCheckIn" },
            },
          },
        },
        responses: {
          "201": { description: "Created or idempotently replayed check-in" },
          "400": { description: "Invalid check-in" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/routines": {
      get: {
        operationId: "listRoutines",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": { description: "Cursor page of routines" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
      post: {
        operationId: "createRoutine",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateRoutine" },
            },
          },
        },
        responses: {
          "201": { description: "Created or idempotently replayed routine" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/appointments": {
      get: {
        operationId: "listAppointments",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": { description: "Cursor page of appointments" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
      post: {
        operationId: "createAppointment",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAppointment" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created or idempotently replayed appointment",
          },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/appointments/{appointmentId}/artifacts": {
      get: {
        operationId: "listAppointmentArtifacts",
        description:
          "Returns patient-owned questions, session events, decisions and generated briefs.",
        parameters: [
          {
            name: "appointmentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Appointment artifacts" },
          "404": { description: "Appointment unavailable" },
        },
      },
      post: {
        operationId: "createAppointmentArtifact",
        description:
          "Creates an idempotent question, event, decision or private-note-safe brief.",
        parameters: [
          {
            name: "appointmentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "201": { description: "Artifact created or replayed" },
          "404": { description: "Appointment unavailable" },
        },
      },
    },
    "/circle": {
      get: {
        operationId: "listCircleRelationships",
        description: "Lists the patient-controlled sharing relationships.",
        responses: {
          "200": { description: "Circle relationships and exact permissions" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
      post: {
        operationId: "createCircleInvitation",
        description:
          "Creates an expiring invitation and version 1 of its share contract.",
        responses: {
          "201": {
            description: "Invitation token returned once to its patient",
          },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/circle/accept": {
      post: {
        operationId: "acceptCircleInvitation",
        description:
          "Accepts an unexpired invitation only for the authenticated matching email.",
        responses: {
          "200": { description: "Activated relationship" },
          "403": { description: "Invalid, expired or already used invitation" },
        },
      },
    },
    "/circle/{relationshipId}": {
      delete: {
        operationId: "revokeCircleRelationship",
        description:
          "Revokes the relationship and every live contract immediately.",
        parameters: [
          {
            name: "relationshipId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Relationship revoked" },
          "404": { description: "Relationship unavailable" },
        },
      },
    },
    "/support-requests": {
      get: {
        operationId: "listSupportRequests",
        description:
          "Lists patient requests and caregiver requests still covered by a live contract.",
        responses: {
          "200": { description: "Visible support requests" },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
      post: {
        operationId: "createSupportRequest",
        description:
          "Creates a precise patient-initiated request; no degradation signal is inferred.",
        responses: {
          "201": { description: "Support request created" },
          "403": { description: "Share contract no longer permits requests" },
        },
      },
    },
    "/support-requests/{supportRequestId}": {
      patch: {
        operationId: "respondToSupportRequest",
        description:
          "Responds only while the caregiver contract is active and permitted.",
        parameters: [
          {
            name: "supportRequestId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Support request updated" },
          "403": { description: "Request or permission unavailable" },
        },
      },
    },
    "/entitlements": {
      get: {
        operationId: "getEntitlements",
        description:
          "Projects Plus from verified Stripe, App Store and Play Store sources.",
        responses: {
          "200": {
            description: "Shared Plus entitlement and duplicate warning",
          },
          "401": { $ref: "#/components/responses/AuthenticationRequired" },
        },
      },
    },
    "/sync/push": {
      post: {
        operationId: "pushSyncOperations",
        description:
          "Applies at most 50 idempotent operations. Mutable entities require an exact base version.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SyncPush" },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Per-operation applied, duplicate, conflict or rejected result",
          },
          "403": { description: "The device has been revoked" },
        },
      },
    },
    "/sync/pull": {
      get: {
        operationId: "pullSyncChanges",
        description: "Returns ordered same-user deltas from an opaque cursor.",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": { description: "Ordered delta page and next opaque cursor" },
          "409": {
            description: "Invalid cursor; client must restart with a full pull",
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "moodday.session_token",
      },
    },
    responses: {
      AuthenticationRequired: {
        description:
          "Verified account and current required consents are required.",
      },
    },
    schemas: {
      CreateCheckIn: {
        type: "object",
        required: ["operationId", "depth", "localDate", "timezone"],
        properties: {
          operationId: { type: "string", minLength: 8, maxLength: 128 },
          depth: { type: "string", enum: ["presence", "quick", "complete"] },
          localDate: { type: "string", format: "date" },
          timezone: { type: "string" },
          valence: { type: ["integer", "null"], minimum: 0, maximum: 10 },
          activation: { type: ["integer", "null"], minimum: 0, maximum: 10 },
          irritability: { type: ["integer", "null"], minimum: 0, maximum: 10 },
          anxiety: { type: ["integer", "null"], minimum: 0, maximum: 10 },
          contexts: { type: "array", maxItems: 12, items: { type: "string" } },
          note: { type: ["string", "null"], maxLength: 2000 },
        },
      },
      CreateRoutine: {
        type: "object",
        required: ["operationId", "entityId", "title"],
        properties: {
          operationId: { type: "string", minLength: 8, maxLength: 128 },
          entityId: { type: "string", minLength: 8, maxLength: 128 },
          title: { type: "string", minLength: 1, maxLength: 120 },
          description: { type: ["string", "null"], maxLength: 1000 },
          weeklyTarget: { type: ["integer", "null"], minimum: 1, maximum: 99 },
          status: { type: "string", enum: ["active", "paused", "archived"] },
        },
      },
      CreateAppointment: {
        type: "object",
        required: ["operationId", "entityId", "title", "startsAt", "timezone"],
        properties: {
          operationId: { type: "string", minLength: 8, maxLength: 128 },
          entityId: { type: "string", minLength: 8, maxLength: 128 },
          title: { type: "string", minLength: 1, maxLength: 160 },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: ["string", "null"], format: "date-time" },
          timezone: { type: "string" },
          status: {
            type: "string",
            enum: ["scheduled", "completed", "cancelled"],
          },
          source: {
            type: "string",
            enum: ["moodday", "google_calendar", "native_calendar"],
          },
          preparationStatus: {
            type: "string",
            enum: ["not_started", "in_progress", "ready", "reviewed"],
          },
        },
      },
      SyncPush: {
        type: "object",
        required: ["deviceId", "platform", "operations"],
        properties: {
          deviceId: { type: "string", minLength: 8, maxLength: 128 },
          platform: { type: "string", enum: ["web", "ios", "android"] },
          operations: {
            type: "array",
            minItems: 1,
            maxItems: 50,
            items: {
              type: "object",
              required: [
                "operationId",
                "entityId",
                "entityType",
                "mutation",
                "payload",
              ],
              properties: {
                operationId: { type: "string" },
                entityId: { type: "string" },
                entityType: {
                  type: "string",
                  enum: ["check_in", "routine", "appointment"],
                },
                mutation: {
                  type: "string",
                  enum: ["create", "update", "delete"],
                },
                baseVersion: { type: ["string", "null"], format: "date-time" },
                payload: {},
              },
            },
          },
        },
      },
      TodayResponse: {
        type: "object",
        description: "Stable envelope containing the Today state.",
      },
      ApiError: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message", "recoverable", "requestId"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              recoverable: { type: "boolean" },
              requestId: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;
