"use server";

import { authAction } from "@/lib/actions/safe-actions";
import {
  acceptInviteSchema,
  chooseRoleSchema,
  completeLessonSchema,
  customNeedSchema,
  gestureIdSchema,
  ownerOnboardingSchema,
  pauseSharingSchema,
  periodDateSchema,
  periodIdSchema,
  saveCheckInSchema,
  sendGestureSchema,
  supporterOnboardingSchema,
  updatePeriodSchema,
  updateSharingSchema,
} from "@moodday/contracts";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { completeLesson } from "./ally.service";
import {
  addCustomNeed,
  archiveCustomNeed,
  saveCheckIn,
  toCheckInDto,
} from "./check-in.service";
import {
  deletePeriod,
  endPeriod,
  startPeriod,
  updatePeriod,
} from "./cycle.service";
import { sendGesture, thankGesture } from "./gesture.service";
import {
  acceptInvite,
  cancelInvite,
  createInvite,
  endLink,
  pauseSharing,
  resumeSharing,
  updateSharing,
} from "./link.service";
import { checkInDeliveryKey, queuePartnerNotification } from "./notify.service";
import {
  chooseRole,
  completeOwnerOnboarding,
  completeSupporterOnboarding,
} from "./profile.service";
import { getUserContext } from "./shared";

const refreshApp = () => {
  revalidatePath("/today");
  revalidatePath("/cycle");
  revalidatePath("/duo");
};

export const chooseRoleAction = authAction
  .inputSchema(chooseRoleSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const profile = await chooseRole(user.id, parsedInput.role);
    return { role: profile.role };
  });

export const completeOwnerOnboardingAction = authAction
  .inputSchema(ownerOnboardingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await completeOwnerOnboarding(user.id, parsedInput);
    refreshApp();
    return { ok: true };
  });

export const completeSupporterOnboardingAction = authAction
  .inputSchema(supporterOnboardingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await completeSupporterOnboarding(user.id, parsedInput);
    refreshApp();
    return { ok: true };
  });

export const saveCheckInAction = authAction
  .inputSchema(saveCheckInSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { today } = await getUserContext(user.id);
    const { checkIn } = await saveCheckIn(user.id, parsedInput, today);
    await queuePartnerNotification(
      checkInDeliveryKey(user.id, checkIn.localDate),
    );
    refreshApp();
    return toCheckInDto(checkIn);
  });

export const startPeriodAction = authAction
  .inputSchema(periodDateSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const { today } = await getUserContext(user.id);
    await startPeriod(user.id, parsedInput.date, today);
    refreshApp();
    return { ok: true };
  });

export const endPeriodAction = authAction
  .inputSchema(periodDateSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await endPeriod(user.id, parsedInput.date);
    refreshApp();
    return { ok: true };
  });

export const updatePeriodAction = authAction
  .inputSchema(updatePeriodSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await updatePeriod(user.id, parsedInput);
    refreshApp();
    return { ok: true };
  });

export const deletePeriodAction = authAction
  .inputSchema(periodIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await deletePeriod(user.id, parsedInput.periodId);
    refreshApp();
    return { ok: true };
  });

export const addCustomNeedAction = authAction
  .inputSchema(customNeedSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const need = await addCustomNeed(user.id, parsedInput.label);
    return { id: need.id, label: need.label };
  });

export const archiveCustomNeedAction = authAction
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput, ctx: { user } }) => {
    await archiveCustomNeed(user.id, parsedInput.id);
    return { ok: true };
  });

export const createInviteAction = authAction.action(async ({ ctx: { user } }) =>
  createInvite(user.id),
);

export const cancelInviteAction = authAction.action(
  async ({ ctx: { user } }) => {
    await cancelInvite(user.id);
    refreshApp();
    return { ok: true };
  },
);

export const acceptInviteAction = authAction
  .inputSchema(acceptInviteSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const link = await acceptInvite(user.id, parsedInput.code);
    refreshApp();
    return { linkId: link.id };
  });

export const updateSharingAction = authAction
  .inputSchema(updateSharingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await updateSharing(user.id, parsedInput);
    refreshApp();
    return { ok: true };
  });

export const pauseSharingAction = authAction
  .inputSchema(pauseSharingSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const pausedUntil = await pauseSharing(user.id, parsedInput.hours);
    refreshApp();
    return { pausedUntil: pausedUntil.toISOString() };
  });

export const resumeSharingAction = authAction.action(
  async ({ ctx: { user } }) => {
    await resumeSharing(user.id);
    refreshApp();
    return { ok: true };
  },
);

export const endLinkAction = authAction.action(async ({ ctx: { user } }) => {
  await endLink(user.id);
  refreshApp();
  return { ok: true };
});

export const sendGestureAction = authAction
  .inputSchema(sendGestureSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const gesture = await sendGesture(user.id, parsedInput);
    refreshApp();
    return { id: gesture.id };
  });

export const thankGestureAction = authAction
  .inputSchema(gestureIdSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await thankGesture(user.id, parsedInput.gestureId);
    refreshApp();
    return { ok: true };
  });

export const completeLessonAction = authAction
  .inputSchema(completeLessonSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    await completeLesson(user.id, parsedInput.slug);
    revalidatePath("/ally");
    refreshApp();
    return { ok: true };
  });
