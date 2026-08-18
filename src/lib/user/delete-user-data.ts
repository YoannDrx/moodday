import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { isManagedMooddayBlobUrl } from "@/lib/files/vercel-blob-adapter";
import { createHmac } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type UserDeletionIdentity = {
  id: string;
  email: string;
};

type DeletionClient = PrismaClient | Prisma.TransactionClient;

const getNonCascadingDeletionQueries = (
  client: DeletionClient,
  user: UserDeletionIdentity,
) => [
  client.userPreferences.deleteMany({
    where: { userId: user.id },
  }),
  client.pushSubscription.deleteMany({
    where: { userId: user.id },
  }),
  client.feedback.deleteMany({
    where: { userId: user.id },
  }),
  client.emailLog.deleteMany({
    where: {
      OR: [{ userId: user.id }, { to: user.email }],
    },
  }),
  client.newsletterSubscriber.deleteMany({
    where: { email: user.email },
  }),
];

const getSubjectReference = (userId: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET).update(userId).digest("hex");

export const enqueueManagedProfileImageDeletion = async (
  client: DeletionClient,
  userId: string,
  image: string | null | undefined,
) => {
  if (!isManagedMooddayBlobUrl(image)) return;
  await client.externalDeletionJob.upsert({
    where: {
      subjectReference_resourceType_resourceLocator: {
        subjectReference: getSubjectReference(userId),
        resourceType: "vercel_blob_profile_image",
        resourceLocator: image,
      },
    },
    update: {},
    create: {
      subjectReference: getSubjectReference(userId),
      resourceType: "vercel_blob_profile_image",
      resourceLocator: image,
      retentionUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
};

export const deleteUserDataOutsideAuthCascade = async (
  user: UserDeletionIdentity,
) => {
  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { image: true },
  });
  await prisma.$transaction(async (transaction) => {
    await enqueueManagedProfileImageDeletion(
      transaction,
      user.id,
      current?.image,
    );
    await Promise.all(getNonCascadingDeletionQueries(transaction, user));
  });
};

export const deleteUserAccountAtomically = async (
  user: UserDeletionIdentity,
) => {
  await prisma.$transaction(async (transaction) => {
    const current = await transaction.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { image: true },
    });
    await enqueueManagedProfileImageDeletion(
      transaction,
      user.id,
      current.image,
    );
    await Promise.all([
      transaction.caregiverRelationship.deleteMany({
        where: {
          OR: [{ patientId: user.id }, { caregiverId: user.id }],
        },
      }),
      transaction.caregiverObservation.deleteMany({
        where: {
          OR: [{ observerId: user.id }, { subjectId: user.id }],
        },
      }),
      transaction.caregiverEvent.deleteMany({
        where: {
          OR: [{ reporterId: user.id }, { subjectId: user.id }],
        },
      }),
      ...getNonCascadingDeletionQueries(transaction, user),
    ]);
    await transaction.user.delete({ where: { id: user.id } });
  });
};
