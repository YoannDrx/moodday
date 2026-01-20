import { headers } from "next/headers";
import { unauthorized } from "next/navigation";
import { auth } from "../auth";
import { prisma } from "../prisma";

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

export const getRequiredUser = async () => {
  const user = await getUser();

  if (!user) {
    unauthorized();
  }

  return user;
};

export const getRequiredAdmin = async () => {
  const user = await getRequiredUser();

  // Fetch fresh role from DB to handle cases where role was updated
  // after the session was created (e.g., in E2E tests)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== "admin") {
    unauthorized();
  }

  return { ...user, role: dbUser.role };
};
