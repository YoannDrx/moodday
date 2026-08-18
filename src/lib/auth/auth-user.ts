import { headers } from "next/headers";
import { notFound, redirect, unauthorized } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { getFeatureAvailability } from "../features/availability";
import { env } from "../env";
import { ActionError } from "../errors/action-error";
import {
  hasRecentAuthentication,
  RECENT_AUTHENTICATION_WINDOW_MS,
} from "./recent-auth";

export { RECENT_AUTHENTICATION_WINDOW_MS };

export const getSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
};

export const getUser = async () => {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  return user;
};

const hasCurrentRequiredConsents = async (userId: string) => {
  const requiredConsents = await prisma.userConsent.findMany({
    where: {
      userId,
      revokedAt: null,
      OR: [
        { purpose: "age_18", version: String(env.MINIMUM_AGE) },
        { purpose: "terms", version: env.LEGAL_TERMS_VERSION },
        { purpose: "privacy", version: env.LEGAL_PRIVACY_VERSION },
        {
          purpose: "health_data",
          version: env.HEALTH_DATA_CONSENT_VERSION,
        },
      ],
    },
    select: { purpose: true },
  });

  return new Set(requiredConsents.map(({ purpose }) => purpose)).size === 4;
};

/** Returns a product-authorized identity without issuing navigation responses. */
export const getAuthorizedApiUser = async () => {
  const user = await getUser();
  if (!user) return null;

  const identity = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  });
  if (!identity?.emailVerified) return null;
  if (!(await hasCurrentRequiredConsents(user.id))) return null;

  return user;
};

export const getRequiredVerifiedUser = async () => {
  const user = await getUser();

  if (!user) {
    unauthorized();
  }

  const identity = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  });

  if (!identity?.emailVerified) {
    redirect("/auth/verify");
  }

  return user;
};

export const getRequiredUser = async () => {
  const user = await getRequiredVerifiedUser();
  if (!(await hasCurrentRequiredConsents(user.id))) {
    redirect("/auth/consent");
  }

  return user;
};

export const getRequiredRecentUser = async () => {
  const session = await getSession();
  if (!session?.user || !hasRecentAuthentication(session)) {
    throw new ActionError("Recent authentication required");
  }
  return getRequiredUser();
};

export const getRequiredAdmin = async () => {
  if (!getFeatureAvailability("admin").enabled) {
    notFound();
  }

  const user = await getRequiredUser();

  // Fetch fresh role from DB to handle cases where role was updated
  // after the session was created (e.g., in E2E tests)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, twoFactorEnabled: true },
  });

  if (dbUser?.role !== "admin") {
    unauthorized();
  }
  if (dbUser.twoFactorEnabled !== true) {
    redirect("/settings/security?adminMfaRequired=true");
  }

  return { ...user, role: dbUser.role };
};
