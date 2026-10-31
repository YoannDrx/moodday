import { authClient } from "./auth-client";
import { unregisterPush } from "./notifications";
import { clearOfflineCheckIns } from "./offline-queue";
import { resetToday } from "./today-store";

/**
 * Signs out after detaching this device from partner notifications, so a
 * shared phone never keeps receiving the previous account's duo messages.
 * `discardOffline` must only be set after the person confirmed it.
 */
export const signOutOfMoodday = async (
  ownerId: string,
  { discardOffline = false }: { discardOffline?: boolean } = {},
) => {
  await unregisterPush().catch(() => undefined);
  if (discardOffline) await clearOfflineCheckIns(ownerId);
  const result = await authClient.signOut();
  if (result.error) throw new Error("sign_out_failed");
  resetToday();
};
