import { prisma } from "@/lib/prisma";

type UserDeletionIdentity = {
  id: string;
  email: string;
};

const getNonCascadingDeletionQueries = (user: UserDeletionIdentity) => [
  prisma.userPreferences.deleteMany({
    where: { userId: user.id },
  }),
  prisma.pushSubscription.deleteMany({
    where: { userId: user.id },
  }),
  prisma.feedback.deleteMany({
    where: { userId: user.id },
  }),
  prisma.emailLog.deleteMany({
    where: {
      OR: [{ userId: user.id }, { to: user.email }],
    },
  }),
  prisma.newsletterSubscriber.deleteMany({
    where: { email: user.email },
  }),
];

export const deleteUserDataOutsideAuthCascade = async (
  user: UserDeletionIdentity,
) => {
  await prisma.$transaction(getNonCascadingDeletionQueries(user));
};

export const deleteUserDataBeforeAccountDeletion = async (
  user: UserDeletionIdentity,
) => {
  await prisma.$transaction([
    prisma.caregiverRelationship.deleteMany({
      where: {
        OR: [{ patientId: user.id }, { caregiverId: user.id }],
      },
    }),
    prisma.caregiverObservation.deleteMany({
      where: {
        OR: [{ observerId: user.id }, { subjectId: user.id }],
      },
    }),
    prisma.caregiverEvent.deleteMany({
      where: {
        OR: [{ reporterId: user.id }, { subjectId: user.id }],
      },
    }),
    ...getNonCascadingDeletionQueries(user),
  ]);
};
