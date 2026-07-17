import { getUser } from "@/lib/auth/auth-user";
import type { PageParams } from "@/types/next";
import { CaregiverInvite } from "./_components/caregiver-invite";

export default async function CaregiverInvitePage(props: PageParams) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : "";
  const user = await getUser();

  return <CaregiverInvite token={token} isAuthenticated={Boolean(user)} />;
}
