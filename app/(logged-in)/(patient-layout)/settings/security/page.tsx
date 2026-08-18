import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { SecurityContent } from "./_components/security-content";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { prisma } from "@/lib/prisma";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.tabs.security"),
    description: t("settings.subtitle"),
  };
});

export default async function SecurityPage() {
  const user = await getRequiredUser();
  const identity = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <SecurityContent twoFactorEnabled={identity.twoFactorEnabled === true} />
  );
}
