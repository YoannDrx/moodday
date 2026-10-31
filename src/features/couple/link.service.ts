import "server-only";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { UpdateSharingInput } from "@moodday/contracts";
import { createHmac, randomInt } from "node:crypto";
import { queuePartnerNotification } from "./notify.service";
import { CoupleError, lockAccounts } from "./shared";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const digestCode = (code: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`couple-invite:${code}`)
    .digest("base64url");

const generateCode = () =>
  Array.from(
    { length: 8 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");

export const formatInviteCode = (code: string) =>
  `${code.slice(0, 4)}-${code.slice(4)}`;

const openLinkWhere = (userId: string) => ({
  status: { in: ["invited" as const, "active" as const] },
  OR: [{ ownerId: userId }, { supporterId: userId }],
});

export const getOpenLink = async (userId: string) =>
  prisma.coupleLink.findFirst({
    where: openLinkWhere(userId),
    include: {
      owner: { select: { id: true, name: true, profile: true } },
      supporter: { select: { id: true, name: true, profile: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export type OpenLink = NonNullable<Awaited<ReturnType<typeof getOpenLink>>>;

export const partnerOf = (link: OpenLink, userId: string) => {
  const partner = link.ownerId === userId ? link.supporter : link.owner;
  if (!partner) return null;
  return {
    id: partner.id,
    name: partner.profile?.displayName ?? partner.name.split(" ")[0],
  };
};

const requireRole = async (userId: string) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });
  if (!profile) {
    throw new CoupleError("role_required", "Choisis d'abord ton côté du duo.");
  }
  return profile.role;
};

/** Creates (or renews) an invitation code. Returns the clear code once. */
export const createInvite = async (userId: string) => {
  const role = await requireRole(userId);
  const code = generateCode();

  await prisma.$transaction(async (tx) => {
    await lockAccounts(tx, userId);
    const open = await tx.coupleLink.findFirst({
      where: openLinkWhere(userId),
    });
    if (open?.status === "active") {
      throw new CoupleError("already_linked", "Tu fais déjà partie d'un duo.");
    }
    const data = {
      inviteCodeDigest: digestCode(code),
      inviteExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
    };
    if (open) {
      await tx.coupleLink.update({ where: { id: open.id }, data });
      return;
    }
    await tx.coupleLink.create({
      data: {
        ...data,
        invitedByRole: role,
        ...(role === "cycle_owner"
          ? { ownerId: userId }
          : { supporterId: userId }),
      },
    });
  });

  return { code: formatInviteCode(code), expiresInDays: 7 };
};

export const cancelInvite = async (userId: string) => {
  await prisma.coupleLink.updateMany({
    where: {
      status: "invited",
      OR: [{ ownerId: userId }, { supporterId: userId }],
    },
    data: {
      status: "ended",
      endedAt: new Date(),
      endedById: userId,
      inviteCodeDigest: null,
    },
  });
};

export const acceptInvite = async (userId: string, code: string) => {
  const role = await requireRole(userId);
  const digest = digestCode(code);
  const candidate = await prisma.coupleLink.findUnique({
    where: { inviteCodeDigest: digest },
  });
  if (
    !candidate ||
    candidate.status !== "invited" ||
    !candidate.inviteExpiresAt ||
    candidate.inviteExpiresAt < new Date()
  ) {
    throw new CoupleError("invalid_code", "Ce code n'existe pas ou a expiré.");
  }
  const inviterId = candidate.ownerId ?? candidate.supporterId;
  if (!inviterId || inviterId === userId) {
    throw new CoupleError(
      "self_invite",
      "On ne forme pas un duo avec soi-même.",
    );
  }
  if (candidate.invitedByRole === role) {
    throw new CoupleError(
      "same_role",
      role === "cycle_owner"
        ? "Ce code vient d'une personne qui a aussi choisi « C'est mon cycle »."
        : "Ce code vient d'une personne qui a aussi choisi le côté partenaire.",
    );
  }

  const link = await prisma.$transaction(async (tx) => {
    await lockAccounts(tx, userId, inviterId);
    const mine = await tx.coupleLink.findFirst({
      where: { ...openLinkWhere(userId), id: { not: candidate.id } },
    });
    if (mine?.status === "active") {
      throw new CoupleError("already_linked", "Tu fais déjà partie d'un duo.");
    }
    if (mine) {
      await tx.coupleLink.update({
        where: { id: mine.id },
        data: {
          status: "ended",
          endedAt: new Date(),
          endedById: userId,
          inviteCodeDigest: null,
        },
      });
    }
    const updated = await tx.coupleLink.updateMany({
      where: { id: candidate.id, status: "invited" },
      data: {
        status: "active",
        acceptedAt: new Date(),
        inviteCodeDigest: null,
        inviteExpiresAt: null,
        ...(role === "cycle_owner"
          ? { ownerId: userId }
          : { supporterId: userId }),
      },
    });
    if (updated.count !== 1) {
      throw new CoupleError(
        "invalid_code",
        "Ce code n'existe pas ou a expiré.",
      );
    }
    return tx.coupleLink.findUniqueOrThrow({ where: { id: candidate.id } });
  });

  await queuePartnerNotification(`link-accepted:${link.id}:${inviterId}`);
  return link;
};

const requireOwnedActiveLink = async (ownerId: string) => {
  const link = await prisma.coupleLink.findFirst({
    where: { ownerId, status: "active" },
  });
  if (!link) {
    throw new CoupleError(
      "no_link",
      "Ces réglages appartiennent à la personne qui partage son cycle.",
    );
  }
  return link;
};

export const updateSharing = async (
  ownerId: string,
  input: UpdateSharingInput,
) => {
  const link = await requireOwnedActiveLink(ownerId);
  await prisma.$transaction([
    prisma.coupleLink.update({
      where: { id: link.id },
      data: { ...input, sharingVersion: { increment: 1 } },
    }),
    prisma.accessLog.create({
      data: {
        ownerId,
        actorId: ownerId,
        linkId: link.id,
        action: "sharing_changed",
        resourceKind: "couple_link",
      },
    }),
  ]);
};

export const pauseSharing = async (ownerId: string, hours: number) => {
  const link = await requireOwnedActiveLink(ownerId);
  const pausedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
  await prisma.$transaction([
    prisma.coupleLink.update({ where: { id: link.id }, data: { pausedUntil } }),
    prisma.accessLog.create({
      data: {
        ownerId,
        actorId: ownerId,
        linkId: link.id,
        action: "paused",
        resourceKind: "couple_link",
      },
    }),
  ]);
  return pausedUntil;
};

export const resumeSharing = async (ownerId: string) => {
  const link = await requireOwnedActiveLink(ownerId);
  await prisma.$transaction([
    prisma.coupleLink.update({
      where: { id: link.id },
      data: { pausedUntil: null },
    }),
    prisma.accessLog.create({
      data: {
        ownerId,
        actorId: ownerId,
        linkId: link.id,
        action: "resumed",
        resourceKind: "couple_link",
      },
    }),
  ]);
};

/** Either member can end the link, without having to give a reason. */
export const endLink = async (userId: string) => {
  const link = await prisma.coupleLink.findFirst({
    where: {
      status: "active",
      OR: [{ ownerId: userId }, { supporterId: userId }],
    },
  });
  if (!link) return null;
  await prisma.$transaction([
    prisma.coupleLink.update({
      where: { id: link.id },
      data: {
        status: "ended",
        endedAt: new Date(),
        endedById: userId,
        pausedUntil: null,
      },
    }),
    ...(link.ownerId
      ? [
          prisma.accessLog.create({
            data: {
              ownerId: link.ownerId,
              actorId: userId,
              linkId: link.id,
              action: "ended" as const,
              resourceKind: "couple_link",
            },
          }),
        ]
      : []),
  ]);
  const otherId = link.ownerId === userId ? link.supporterId : link.ownerId;
  if (otherId)
    await queuePartnerNotification(`link-ended:${link.id}:${otherId}`);
  return link.id;
};
