import { getSession } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "next/navigation";
import { logger } from "../logger";

export type CurrentUserPayload = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string | null;
    periodStart: Date | null;
    periodEnd: Date | null;
    cancelAtPeriodEnd: boolean | null;
  } | null;
  stripeCustomerId: string | null;
};

export const getCurrentUser = async (): Promise<CurrentUserPayload | null> => {
  const session = await getSession();

  if (!session?.user.id) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.user.id },
    include: {
      subscription: true,
    },
  });

  logger.debug("subs", user);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    subscription: user.subscription
      ? {
          id: user.subscription.id,
          plan: user.subscription.plan,
          status: user.subscription.status,
          periodStart: user.subscription.periodStart,
          periodEnd: user.subscription.periodEnd,
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : null,
    stripeCustomerId: user.stripeCustomerId,
  };
};

export const getRequiredCurrentUser = async (): Promise<CurrentUserPayload> => {
  const user = await getCurrentUser();

  if (!user) {
    unauthorized();
  }

  return user;
};
