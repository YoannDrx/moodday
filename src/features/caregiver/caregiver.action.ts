"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
});

export const getCaregiverActivity = authAction
  .inputSchema(getActivitySchema)
  .action(async ({ parsedInput: { days, limit }, ctx: { user } }) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get observations made by this user
    const observations = await prisma.caregiverObservation.findMany({
      where: {
        observerId: user.id,
        createdAt: { gte: since },
      },
      include: {
        subject: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get events reported by this user
    const events = await prisma.caregiverEvent.findMany({
      where: {
        reporterId: user.id,
        createdAt: { gte: since },
      },
      include: {
        subject: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Combine and sort by date
    const activity = [
      ...observations.map((o) => ({
        type: "observation" as const,
        id: o.id,
        subjectName: o.subject.name,
        subjectImage: o.subject.image,
        moodObserved: o.moodObserved,
        energyObserved: o.energyObserved,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        type: "event" as const,
        id: e.id,
        subjectName: e.subject.name,
        subjectImage: e.subject.image,
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

export const getCaregiverSummary = authAction.action(
  async ({ ctx: { user } }) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    // Observations count
    const observationsThisWeek = await prisma.caregiverObservation.count({
      where: {
        observerId: user.id,
        createdAt: { gte: startOfWeek },
      },
    });

    const observationsThisMonth = await prisma.caregiverObservation.count({
      where: {
        observerId: user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    // Events count
    const eventsThisMonth = await prisma.caregiverEvent.count({
      where: {
        reporterId: user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    // Recent concerning events
    const concerningEvents = await prisma.caregiverEvent.count({
      where: {
        reporterId: user.id,
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
  },
);
