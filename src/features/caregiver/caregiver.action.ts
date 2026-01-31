"use server";

import { action, authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { nanoid } from "nanoid";
import { sendEmail } from "@/lib/mail/send-email";
import MarkdownEmail from "@email/markdown.email";
import { getServerUrl } from "@/lib/server-url";
import { getI18n } from "@/i18n/server";

// ═══════════════════════════════════════════════════════════════
// CAREGIVER RELATIONSHIP SYSTEM
// ═══════════════════════════════════════════════════════════════

// ===== Invite a Caregiver =====

const inviteCaregiverSchema = z.object({
  email: z.string().email(),
  role: z.enum(["family", "friend", "professional"]),
  label: z.string().optional(),
  permissions: z
    .array(z.string())
    .default(["view_mood", "add_observations", "add_events"]),
});

const roleLabelKeys: Record<string, string> = {
  family: "caregiver.roles.family",
  friend: "caregiver.roles.friend",
  professional: "caregiver.roles.professional",
};

const sendCaregiverInviteEmail = async (params: {
  email: string;
  inviteToken: string;
  patientName: string | null | undefined;
  role: string;
  label?: string | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) => {
  const inviteUrl = `${getServerUrl()}/invite/caregiver?token=${params.inviteToken}`;
  const patientName = params.patientName?.trim().length
    ? params.patientName
    : params.t("caregiver.inviteEmail.patientFallback");
  const roleLabel = params.t(
    roleLabelKeys[params.role] ?? "caregiver.roles.default",
  );
  const labelLine = params.label?.trim()
    ? params.t("caregiver.inviteEmail.labelLine", { label: params.label })
    : "";

  const markdown = [
    params.t("caregiver.inviteEmail.greeting"),
    "",
    params.t("caregiver.inviteEmail.intro", { patientName, roleLabel }),
    ...(labelLine ? [labelLine] : []),
    "",
    params.t("caregiver.inviteEmail.cta"),
    inviteUrl,
    "",
    params.t("caregiver.inviteEmail.ignore"),
  ].join("\n");

  await sendEmail({
    to: params.email,
    subject: params.t("caregiver.inviteEmail.subject"),
    html: MarkdownEmail({
      markdown,
      preview: params.t("caregiver.inviteEmail.preview", { patientName }),
    }),
  });
};

export const inviteCaregiver = authAction
  .inputSchema(inviteCaregiverSchema)
  .action(
    async ({
      parsedInput: { email, role, label, permissions },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      // Check if user is trying to invite themselves
      if (email === user.email) {
        throw new Error(t("caregiver.errors.selfInvite"));
      }

      // Check if caregiver user exists
      const caregiverUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true },
      });

      const existingRelation = await prisma.caregiverRelationship.findFirst({
        where: {
          patientId: user.id,
          OR: [
            { caregiverEmail: email },
            ...(caregiverUser ? [{ caregiverId: caregiverUser.id }] : []),
          ],
        },
      });

      // Generate invite token
      const inviteToken = nanoid(32);
      const inviteExpiry = new Date();
      inviteExpiry.setDate(inviteExpiry.getDate() + 7); // 7 days validity

      if (existingRelation) {
        if (existingRelation.status === "active") {
          throw new Error(t("caregiver.errors.alreadyInCircle"));
        }

        if (
          existingRelation.status === "pending" &&
          existingRelation.inviteExpiry &&
          existingRelation.inviteExpiry > new Date()
        ) {
          throw new Error(t("caregiver.errors.pendingInvite"));
        }

        const updated = await prisma.caregiverRelationship.update({
          where: { id: existingRelation.id },
          data: {
            caregiverId: caregiverUser?.id ?? null,
            caregiverEmail: email,
            role,
            label,
            permissions,
            status: "pending",
            inviteToken,
            inviteExpiry,
          },
        });

        await sendCaregiverInviteEmail({
          email,
          inviteToken,
          patientName: user.name,
          role,
          label,
          t,
        });

        return {
          id: updated.id,
          inviteToken,
          caregiverExists: !!caregiverUser,
        };
      }

      // Create the relationship
      const relationship = await prisma.caregiverRelationship.create({
        data: {
          patientId: user.id,
          caregiverId: caregiverUser?.id ?? null,
          caregiverEmail: email,
          role,
          label,
          permissions,
          status: "pending",
          inviteToken,
          inviteExpiry,
        },
      });

      await sendCaregiverInviteEmail({
        email,
        inviteToken,
        patientName: user.name,
        role,
        label,
        t,
      });

      return {
        id: relationship.id,
        inviteToken,
        caregiverExists: !!caregiverUser,
      };
    },
  );

// ===== Get Invitation Info (public) =====

const inviteInfoSchema = z.object({
  inviteToken: z.string(),
});

export const getCaregiverInviteInfo = action
  .inputSchema(inviteInfoSchema)
  .action(async ({ parsedInput: { inviteToken } }) => {
    const { t } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
      include: {
        patient: { select: { name: true, email: true, image: true } },
      },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidOrExpiredInvite"));
    }

    if (relationship.inviteExpiry && relationship.inviteExpiry < new Date()) {
      throw new Error(t("caregiver.errors.inviteExpired"));
    }

    return {
      id: relationship.id,
      status: relationship.status,
      role: relationship.role,
      label: relationship.label,
      patientName: relationship.patient.name,
      patientEmail: relationship.patient.email,
      patientImage: relationship.patient.image,
      inviteExpiry: relationship.inviteExpiry?.toISOString() ?? null,
    };
  });

// ===== Accept Caregiver Invitation =====

const acceptInvitationSchema = z.object({
  inviteToken: z.string(),
});

export const acceptCaregiverInvitation = authAction
  .inputSchema(acceptInvitationSchema)
  .action(async ({ parsedInput: { inviteToken }, ctx: { user } }) => {
    const { t } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
      include: {
        patient: { select: { name: true } },
      },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidOrExpiredInvite"));
    }

    if (relationship.inviteExpiry && relationship.inviteExpiry < new Date()) {
      throw new Error(t("caregiver.errors.inviteExpired"));
    }

    if (relationship.status === "active") {
      throw new Error(t("caregiver.errors.inviteAlreadyAccepted"));
    }

    if (relationship.patientId === user.id) {
      throw new Error(t("caregiver.errors.acceptOwnInvite"));
    }

    if (
      relationship.caregiverEmail &&
      relationship.caregiverEmail !== user.email
    ) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    if (relationship.caregiverId && relationship.caregiverId !== user.id) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    // Update the relationship
    const updated = await prisma.caregiverRelationship.update({
      where: { id: relationship.id },
      data: {
        caregiverId: user.id,
        caregiverEmail: user.email,
        status: "active",
        inviteToken: null,
        inviteExpiry: null,
      },
    });

    return {
      id: updated.id,
      patientName: relationship.patient.name,
    };
  });

// ===== Decline Caregiver Invitation =====

export const declineCaregiverInvitation = authAction
  .inputSchema(acceptInvitationSchema)
  .action(async ({ parsedInput: { inviteToken }, ctx: { user } }) => {
    const { t } = await getI18n();
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { inviteToken },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.invalidInvite"));
    }

    if (
      relationship.caregiverEmail &&
      relationship.caregiverEmail !== user.email
    ) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    if (relationship.caregiverId && relationship.caregiverId !== user.id) {
      throw new Error(t("caregiver.errors.inviteNotForYou"));
    }

    await prisma.caregiverRelationship.update({
      where: { id: relationship.id },
      data: {
        status: "declined",
        inviteToken: null,
        inviteExpiry: null,
      },
    });

    return { success: true };
  });

// ===== Get My Caregivers (as patient) =====

export const getMyCaregivers = authAction.action(async ({ ctx: { user } }) => {
  const relationships = await prisma.caregiverRelationship.findMany({
    where: {
      patientId: user.id,
    },
    include: {
      caregiver: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return relationships.map((r) => ({
    id: r.id,
    caregiverId: r.caregiverId,
    caregiverName: r.caregiver?.name ?? null,
    caregiverEmail: r.caregiver?.email ?? r.caregiverEmail,
    caregiverImage: r.caregiver?.image ?? null,
    role: r.role,
    label: r.label,
    permissions: r.permissions,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));
});

// ===== Get My Patients (as caregiver) =====

export const getMyPatients = authAction.action(async ({ ctx: { user } }) => {
  const relationships = await prisma.caregiverRelationship.findMany({
    where: {
      caregiverId: user.id,
      status: "active",
    },
    include: {
      patient: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return relationships.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    patientName: r.patient.name,
    patientEmail: r.patient.email,
    patientImage: r.patient.image,
    role: r.role,
    label: r.label,
    permissions: r.permissions,
    createdAt: r.createdAt.toISOString(),
  }));
});

// ===== Update Caregiver Permissions =====

const updatePermissionsSchema = z.object({
  relationshipId: z.string(),
  permissions: z.array(z.string()),
  label: z.string().optional(),
});

export const updateCaregiverPermissions = authAction
  .inputSchema(updatePermissionsSchema)
  .action(
    async ({
      parsedInput: { relationshipId, permissions, label },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      // Verify the user owns this relationship (is the patient)
      const relationship = await prisma.caregiverRelationship.findUnique({
        where: { id: relationshipId },
      });

      if (relationship?.patientId !== user.id) {
        throw new Error(t("caregiver.errors.relationshipNotFoundOrUnauthorized"));
      }

      const updated = await prisma.caregiverRelationship.update({
        where: { id: relationshipId },
        data: {
          permissions,
          label: label ?? relationship.label,
        },
      });

      return { id: updated.id, permissions: updated.permissions };
    },
  );

// ===== Remove Caregiver Relationship =====

const removeRelationshipSchema = z.object({
  relationshipId: z.string(),
});

export const removeCaregiverRelationship = authAction
  .inputSchema(removeRelationshipSchema)
  .action(async ({ parsedInput: { relationshipId }, ctx: { user } }) => {
    const { t } = await getI18n();
    // Verify the user is either the patient or the caregiver
    const relationship = await prisma.caregiverRelationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      throw new Error(t("caregiver.errors.relationshipNotFound"));
    }

    if (
      relationship.patientId !== user.id &&
      relationship.caregiverId !== user.id
    ) {
      throw new Error(t("caregiver.errors.relationshipDeleteNotAllowed"));
    }

    await prisma.caregiverRelationship.delete({
      where: { id: relationshipId },
    });

    return { success: true };
  });

// ===== Create Observation =====

const createObservationSchema = z.object({
  subjectId: z.string(),
  moodObserved: z.string().optional(),
  energyObserved: z.string().optional(),
  socialBehavior: z.string().optional(),
  sleepObserved: z.string().optional(),
  notes: z.string().optional(),
  visibleToPatient: z.boolean().default(true),
});

export const createObservation = authAction
  .inputSchema(createObservationSchema)
  .action(
    async ({
      parsedInput: {
        subjectId,
        moodObserved,
        energyObserved,
        socialBehavior,
        sleepObserved,
        notes,
        visibleToPatient,
      },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      if (subjectId !== user.id) {
        const relationship = await prisma.caregiverRelationship.findFirst({
          where: {
            caregiverId: user.id,
            patientId: subjectId,
            status: "active",
          },
        });

        if (!relationship) {
          throw new Error(t("caregiver.errors.notAllowedObserve"));
        }

        if (!relationship.permissions.includes("add_observations")) {
          throw new Error(t("caregiver.errors.insufficientObservationPermission"));
        }
      }

      const observation = await prisma.caregiverObservation.create({
        data: {
          observerId: user.id,
          subjectId,
          moodObserved,
          energyObserved,
          socialBehavior,
          sleepObserved,
          notes,
          visibleToPatient,
        },
      });

      return observation;
    },
  );

// ===== Create Event =====

const createEventSchema = z.object({
  subjectId: z.string(),
  eventType: z.string(),
  severity: z.number().min(1).max(5),
  description: z.string(),
  eventDate: z.string().optional(),
  visibleToPatient: z.boolean().default(true),
});

export const createEvent = authAction
  .inputSchema(createEventSchema)
  .action(
    async ({
      parsedInput: {
        subjectId,
        eventType,
        severity,
        description,
        eventDate,
        visibleToPatient,
      },
      ctx: { user },
    }) => {
      const { t } = await getI18n();
      if (subjectId !== user.id) {
        const relationship = await prisma.caregiverRelationship.findFirst({
          where: {
            caregiverId: user.id,
            patientId: subjectId,
            status: "active",
          },
        });

        if (!relationship) {
          throw new Error(t("caregiver.errors.notAllowedReportEvent"));
        }

        if (!relationship.permissions.includes("add_events")) {
          throw new Error(t("caregiver.errors.insufficientEventPermission"));
        }
      }

      const event = await prisma.caregiverEvent.create({
        data: {
          reporterId: user.id,
          subjectId,
          eventType,
          severity,
          description,
          eventDate: eventDate ? new Date(eventDate) : new Date(),
          visibleToPatient,
        },
      });

      return event;
    },
  );

// ===== Get Activity (Observations + Events) =====

const getActivitySchema = z.object({
  days: z.number().optional().default(30),
  limit: z.number().optional().default(20),
  mode: z.enum(["caregiver", "patient"]).optional(),
});

export const getCaregiverActivity = authAction
  .inputSchema(getActivitySchema)
  .action(async ({ parsedInput: { days, limit, mode }, ctx: { user } }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const hasPatients = await prisma.caregiverRelationship.findFirst({
      where: {
        caregiverId: user.id,
        status: "active",
      },
      select: { id: true },
    });

    const effectiveMode = mode ?? (hasPatients ? "caregiver" : "patient");

    const observationFilter =
      effectiveMode === "caregiver"
        ? { observerId: user.id }
        : { subjectId: user.id, visibleToPatient: true };

    const eventFilter =
      effectiveMode === "caregiver"
        ? { reporterId: user.id }
        : { subjectId: user.id, visibleToPatient: true };

    const observations = await prisma.caregiverObservation.findMany({
      where: {
        ...observationFilter,
        createdAt: { gte: since },
      },
      include: {
        subject: { select: { name: true, image: true } },
        observer: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const events = await prisma.caregiverEvent.findMany({
      where: {
        ...eventFilter,
        createdAt: { gte: since },
      },
      include: {
        subject: { select: { name: true, image: true } },
        reporter: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Combine and sort by date
    const activity = [
      ...observations.map((o) => ({
        type: "observation" as const,
        id: o.id,
        subjectName:
          effectiveMode === "caregiver" ? o.subject.name : o.observer.name,
        subjectImage:
          effectiveMode === "caregiver" ? o.subject.image : o.observer.image,
        moodObserved: o.moodObserved,
        energyObserved: o.energyObserved,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        type: "event" as const,
        id: e.id,
        subjectName:
          effectiveMode === "caregiver" ? e.subject.name : e.reporter.name,
        subjectImage:
          effectiveMode === "caregiver" ? e.subject.image : e.reporter.image,
        eventType: e.eventType,
        severity: e.severity,
        description: e.description,
        eventDate: e.eventDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return activity.slice(0, limit);
  });

// ===== Get Observations Received (for patient view) =====

export const getReceivedObservations = authAction
  .inputSchema(getActivitySchema)
  .action(async ({ parsedInput: { days, limit }, ctx: { user } }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const observations = await prisma.caregiverObservation.findMany({
      where: {
        subjectId: user.id,
        visibleToPatient: true,
        createdAt: { gte: since },
      },
      include: {
        observer: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return observations.map((o) => ({
      id: o.id,
      observerName: o.observer.name,
      observerImage: o.observer.image,
      moodObserved: o.moodObserved,
      energyObserved: o.energyObserved,
      socialBehavior: o.socialBehavior,
      sleepObserved: o.sleepObserved,
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
    }));
  });

// ===== Get Summary Stats =====

const getSummarySchema = z.object({
  mode: z.enum(["caregiver", "patient"]).optional(),
});

export const getCaregiverSummary = authAction
  .inputSchema(getSummarySchema)
  .action(async ({ parsedInput: { mode }, ctx: { user } }) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const hasPatients = await prisma.caregiverRelationship.findFirst({
      where: {
        caregiverId: user.id,
        status: "active",
      },
      select: { id: true },
    });

    const effectiveMode = mode ?? (hasPatients ? "caregiver" : "patient");

    const observationFilter =
      effectiveMode === "caregiver"
        ? { observerId: user.id }
        : { subjectId: user.id, visibleToPatient: true };

    const eventFilter =
      effectiveMode === "caregiver"
        ? { reporterId: user.id }
        : { subjectId: user.id, visibleToPatient: true };

    // Observations count
    const observationsThisWeek = await prisma.caregiverObservation.count({
      where: {
        ...observationFilter,
        createdAt: { gte: startOfWeek },
      },
    });

    const observationsThisMonth = await prisma.caregiverObservation.count({
      where: {
        ...observationFilter,
        createdAt: { gte: startOfMonth },
      },
    });

    // Events count
    const eventsThisMonth = await prisma.caregiverEvent.count({
      where: {
        ...eventFilter,
        createdAt: { gte: startOfMonth },
      },
    });

    // Recent concerning events
    const concerningEvents = await prisma.caregiverEvent.count({
      where: {
        ...eventFilter,
        severity: { gte: 4 },
        createdAt: { gte: startOfMonth },
      },
    });

    return {
      observationsThisWeek,
      observationsThisMonth,
      eventsThisMonth,
      concerningEvents,
    };
  });
