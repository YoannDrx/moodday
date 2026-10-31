import { MooddayLogo } from "@/components/brand/moodday-logo";
import { getUserContext } from "@/features/couple/shared";
import { OnboardingFlow } from "@/features/couple/ui/onboarding-flow";
import { getRequiredUser } from "@/lib/auth/auth-user";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Bienvenue" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage(props: {
  searchParams: Promise<{ porte?: string }>;
}) {
  const user = await getRequiredUser();
  const context = await getUserContext(user.id);
  if (context.role && context.onboarded) redirect("/today");
  const { porte } = await props.searchParams;

  return (
    <div className="knit min-h-full px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <MooddayLogo />
        <OnboardingFlow
          initialRole={
            context.role ??
            (porte === "partner"
              ? "supporter"
              : porte === "cycle"
                ? "cycle_owner"
                : null)
          }
          roleConfirmed={Boolean(context.role)}
          suggestedName={user.name.split(" ")[0] ?? ""}
        />
      </div>
    </div>
  );
}
