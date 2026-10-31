import { getUserContext } from "@/features/couple/shared";
import { AppShell } from "@/features/app-shell/app-shell";
import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Compte" };

export default async function RouteLayout(props: LayoutParams) {
  const user = await getRequiredUser();
  const context = await getUserContext(user.id);

  return (
    <AppShell role={context.onboarded ? context.role : null} user={user}>
      {props.children}
    </AppShell>
  );
}
