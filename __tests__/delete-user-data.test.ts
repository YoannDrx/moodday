import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  betterAuthSecret: "test-deletion-hmac-secret",
}));

vi.mock("@/lib/env", () => ({
  env: { BETTER_AUTH_SECRET: state.betterAuthSecret },
}));

import {
  deleteUserAccountAtomically,
  deleteUserDataOutsideAuthCascade,
  enqueueManagedProfileImageDeletion,
} from "@/lib/user/delete-user-data";
import { prisma } from "@/lib/prisma";

const user = { id: "user-to-delete", email: "alice@example.test" };
const managedImage =
  "https://moodday.public.blob.vercel-storage.com/profile-images/avatar.png";

describe("user data deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.externalDeletionJob.upsert).mockResolvedValue({} as never);
  });

  it.each([null, undefined, "https://example.test/avatar.png", "invalid-url"])(
    "does not enqueue an unmanaged profile image: %s",
    async (image) => {
      await enqueueManagedProfileImageDeletion(prisma, user.id, image);
      expect(prisma.externalDeletionJob.upsert).not.toHaveBeenCalled();
    },
  );

  it("enqueues a managed image using an irreversible subject reference", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-18T14:00:00.000Z"));

    await enqueueManagedProfileImageDeletion(prisma, user.id, managedImage);

    const subjectReference = createHmac("sha256", state.betterAuthSecret)
      .update(user.id)
      .digest("hex");
    expect(prisma.externalDeletionJob.upsert).toHaveBeenCalledWith({
      where: {
        subjectReference_resourceType_resourceLocator: {
          subjectReference,
          resourceType: "vercel_blob_profile_image",
          resourceLocator: managedImage,
        },
      },
      update: {},
      create: {
        subjectReference,
        resourceType: "vercel_blob_profile_image",
        resourceLocator: managedImage,
        retentionUntil: new Date("2026-08-19T14:00:00.000Z"),
      },
    });

    vi.useRealTimers();
  });

  it("removes all non-cascading records and queues the current managed image", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      image: managedImage,
    } as never);

    await deleteUserDataOutsideAuthCascade(user);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.externalDeletionJob.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.userPreferences.deleteMany).toHaveBeenCalledWith({
      where: { userId: user.id },
    });
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { userId: user.id },
    });
    expect(prisma.feedback.deleteMany).toHaveBeenCalledWith({
      where: { userId: user.id },
    });
    expect(prisma.emailLog.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ userId: user.id }, { to: user.email }] },
    });
    expect(prisma.newsletterSubscriber.deleteMany).toHaveBeenCalledWith({
      where: { email: user.email },
    });
  });

  it("tolerates a missing user image during the Better Auth cascade", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await deleteUserDataOutsideAuthCascade(user);

    expect(prisma.externalDeletionJob.upsert).not.toHaveBeenCalled();
    expect(prisma.userPreferences.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("deletes caregiver records and the account in the same transaction", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      image: managedImage,
    } as never);

    await deleteUserAccountAtomically(user);

    expect(prisma.caregiverRelationship.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ patientId: user.id }, { caregiverId: user.id }] },
    });
    expect(prisma.caregiverObservation.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ observerId: user.id }, { subjectId: user.id }] },
    });
    expect(prisma.caregiverEvent.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ reporterId: user.id }, { subjectId: user.id }] },
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: user.id },
    });
  });

  it("rolls back the account deletion when a dependent deletion fails", async () => {
    const failure = new Error("dependent deletion failed");
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      image: null,
    } as never);
    vi.mocked(prisma.feedback.deleteMany).mockRejectedValue(failure);

    await expect(deleteUserAccountAtomically(user)).rejects.toBe(failure);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
