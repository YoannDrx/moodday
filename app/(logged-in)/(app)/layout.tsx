import { getUserContext } from "@/features/couple/shared";
import { AppShell } from "@/features/app-shell/app-shell";
import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import { redirect } from "next/navigation";

// Fresh session and couple state on every request.
export const dynamic = "force-dynamic";

export default async function AppLayout(props: LayoutParams) {
  const user = await getRequiredUser();
  const context = await getUserContext(user.id);
  if (!context.role || !context.onboarded) redirect("/onboarding");

  return (
    <AppShell role={context.role} user={user}>
      {props.children}
    </AppShell>
  );
}
