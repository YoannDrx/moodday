import {
  syncedPreferencesSchema,
  userDraftKindSchema,
  userDraftSchema,
  type SyncedPreferencesDto,
  type UserDraftDto,
  type UserDraftKind,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const syncedPreferencesSelection = {
  id: true,
  locale: true,
  timezone: true,
  reducedMotion: true,
  preferredTextScale: true,
  notificationsEnabled: true,
  dailyCheckInReminder: true,
  dailyCheckInTime: true,
  medicationReminders: true,
  medicationReminderTime: true,
  updatedAt: true,
} satisfies Prisma.UserPreferencesSelect;

type SelectedPreferences = Prisma.UserPreferencesGetPayload<{
  select: typeof syncedPreferencesSelection;
}>;

export const toSyncedPreferencesDto = (
  value: SelectedPreferences,
): SyncedPreferencesDto =>
  syncedPreferencesSchema.parse({
    ...value,
    preferredTextScale: value.preferredTextScale,
    updatedAt: value.updatedAt.toISOString(),
  });

export const userDraftSelection = {
  id: true,
  kind: true,
  contextKey: true,
  content: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserDraftSelect;

type SelectedDraft = Prisma.UserDraftGetPayload<{
  select: typeof userDraftSelection;
}>;

export const toUserDraftDto = (value: SelectedDraft): UserDraftDto =>
  userDraftSchema.parse({
    ...value,
    createdAt: value.createdAt.toISOString(),
    updatedAt: value.updatedAt.toISOString(),
  });

export const getSyncedPreferences = async (
  userId: string,
): Promise<SyncedPreferencesDto | null> => {
  const value = await prisma.userPreferences.findUnique({
    where: { userId },
    select: syncedPreferencesSelection,
  });
  return value ? toSyncedPreferencesDto(value) : null;
};

export const getUserDraft = async ({
  userId,
  kind,
  contextKey,
}: {
  userId: string;
  kind: UserDraftKind;
  contextKey: string;
}): Promise<UserDraftDto | null> => {
  const parsedKind = userDraftKindSchema.parse(kind);
  const value = await prisma.userDraft.findUnique({
    where: {
      userId_kind_contextKey: { userId, kind: parsedKind, contextKey },
    },
    select: userDraftSelection,
  });
  return value ? toUserDraftDto(value) : null;
};

export const assertDraftContentSize = (content: unknown) => {
  if (JSON.stringify(content).length > 20_000) {
    throw new Error("draft_content_too_large");
  }
};
