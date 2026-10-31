import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";

import { LifecycleEmailsToggle } from "./_components/lifecycle-toggle";
import { PrivacyContent } from "./_components/privacy-content";

export const generateMetadata = combineWithParentMetadata(async () => ({
  title: "Confidentialité et données",
}));

export default async function PrivacyPage() {
  const user = await getRequiredUser();
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: user.id },
    select: { lifecycleEmails: true },
  });
  return (
    <PrivacyContent
      emailSettings={
        <LifecycleEmailsToggle initial={preferences?.lifecycleEmails ?? true} />
      }
    />
  );
}
