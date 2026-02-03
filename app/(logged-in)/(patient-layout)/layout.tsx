import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import { PatientNavigation } from "../_navigation/patient-navigation";

// Force dynamic rendering to ensure fresh session data on every request
export const dynamic = "force-dynamic";

export default async function PatientLayout(props: LayoutParams) {
  const user = await getRequiredUser();
  return <PatientNavigation user={user}>{props.children}</PatientNavigation>;
}
