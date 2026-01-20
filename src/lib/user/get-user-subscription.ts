import type { Prisma } from "@/generated/prisma";
import type { CurrentUserPayload } from "./get-user";
import { getCurrentUser } from "./get-user";

export const getUserActiveSubscription = async () => {
  const user = await getCurrentUser();

  if (!user?.subscription) {
    return null;
  }

  const subscription = user.subscription;

  return {
    ...subscription,
    stripeCustomerId: user.stripeCustomerId,
    userId: user.id,
  };
};

export type UserActiveSubscription = NonNullable<
  Prisma.PromiseReturnType<typeof getUserActiveSubscription>
>;

export const checkUserSubscription = async (
  user: CurrentUserPayload | null,
): Promise<boolean> => {
  if (!user?.subscription) return false;

  return user.subscription.status === "active";
};
