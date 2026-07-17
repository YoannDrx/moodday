import { prisma } from "@/lib/prisma";
import { deleteManagedMooddayBlob } from "@/lib/files/vercel-blob-adapter";

export const replaceUserProfileImage = async (params: {
  userId: string;
  nextImage: string | null;
}) => {
  const current = await prisma.user.findUniqueOrThrow({
    where: { id: params.userId },
    select: { image: true },
  });

  if (current.image === params.nextImage) return params.nextImage;

  await prisma.user.update({
    where: { id: params.userId },
    data: { image: params.nextImage },
    select: { id: true },
  });

  try {
    await deleteManagedMooddayBlob(current.image);
  } catch (error) {
    await prisma.user.updateMany({
      where: { id: params.userId, image: params.nextImage },
      data: { image: current.image },
    });
    throw error;
  }

  return params.nextImage;
};

export const purgeUserProfileImage = async (userId: string) => {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  if (!current?.image) return false;

  const deleted = await deleteManagedMooddayBlob(current.image);
  if (deleted) {
    await prisma.user.updateMany({
      where: { id: userId, image: current.image },
      data: { image: null },
    });
  }
  return deleted;
};
