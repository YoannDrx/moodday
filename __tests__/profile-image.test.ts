import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  deleteManagedMooddayBlob: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}));

vi.mock("@/lib/files/vercel-blob-adapter", () => ({
  deleteManagedMooddayBlob: mocks.deleteManagedMooddayBlob,
}));

import {
  purgeUserProfileImage,
  replaceUserProfileImage,
} from "../src/features/profile/profile-image";

describe("profile image lifecycle", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.update.mockResolvedValue({ id: "user-1" });
    mocks.updateMany.mockResolvedValue({ count: 1 });
  });

  it("replaces the database reference before deleting the previous blob", async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ image: "https://old.test" });
    mocks.deleteManagedMooddayBlob.mockResolvedValue(true);

    await expect(
      replaceUserProfileImage({
        userId: "user-1",
        nextImage: "https://new.test",
      }),
    ).resolves.toBe("https://new.test");

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { image: "https://new.test" },
      select: { id: true },
    });
    expect(mocks.deleteManagedMooddayBlob).toHaveBeenCalledWith(
      "https://old.test",
    );
  });

  it("restores the previous reference if old-file deletion fails", async () => {
    const deletionError = new Error("Blob unavailable");
    mocks.findUniqueOrThrow.mockResolvedValue({ image: "https://old.test" });
    mocks.deleteManagedMooddayBlob.mockRejectedValue(deletionError);

    await expect(
      replaceUserProfileImage({
        userId: "user-1",
        nextImage: "https://new.test",
      }),
    ).rejects.toThrow(deletionError);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", image: "https://new.test" },
      data: { image: "https://old.test" },
    });
  });

  it("purges a managed image and clears its database reference", async () => {
    mocks.findUnique.mockResolvedValue({ image: "https://owned.test" });
    mocks.deleteManagedMooddayBlob.mockResolvedValue(true);

    await expect(purgeUserProfileImage("user-1")).resolves.toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "user-1", image: "https://owned.test" },
      data: { image: null },
    });
  });
});
