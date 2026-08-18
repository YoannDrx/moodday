import { getUser } from "@/lib/auth/auth-user";
import type { PageParams } from "@/types/next";
import { CaregiverInvite } from "./_components/caregiver-invite";
import { getFeatureAvailability } from "@/lib/features/availability";
import { notFound } from "next/navigation";

export default async function CaregiverInvitePage(props: PageParams) {
  if (!getFeatureAvailability("caregiverSharing").enabled) {
    notFound();
  }

  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : "";
  const user = await getUser();

  return <CaregiverInvite token={token} isAuthenticated={Boolean(user)} />;
}
