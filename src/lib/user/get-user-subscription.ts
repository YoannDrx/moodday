import type { Prisma } from "@prisma/client";
import { getEffectivePlan } from "@/lib/billing/entitlements";
import { getV2PlusEntitlement } from "@/features/v2/entitlements/service";
import type { CurrentUserPayload } from "./get-user";
import { getCurrentUser } from "./get-user";

export const getUserActiveSubscription = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const entitlement = await getV2PlusEntitlement(user.id);
  if (!user.subscription) return null;
  const legacyActive = getEffectivePlan(user.subscription) === "plus";
  if (!entitlement.active && !legacyActive) return null;
  const sourceProviders: ("stripe" | "app_store" | "play_store")[] =
    entitlement.active ? [...entitlement.sourceProviders] : ["stripe"];

  const subscription = user.subscription;

  return {
    ...subscription,
    stripeCustomerId: user.stripeCustomerId,
    userId: user.id,
    sourceProviders,
    duplicateSubscription: entitlement.active
      ? entitlement.duplicateSubscription
      : false,
    manageWith: entitlement.active ? entitlement.manageWith : "stripe",
  };
};

export type UserActiveSubscription = NonNullable<
  Prisma.PromiseReturnType<typeof getUserActiveSubscription>
>;

export const checkUserSubscription = async (
  user: CurrentUserPayload | null,
): Promise<boolean> => {
  if (!user?.subscription) return false;

  return getEffectivePlan(user.subscription) === "plus";
};
