import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import { PatientNavigation } from "../_navigation/patient-navigation";

export default async function PatientLayout(props: LayoutParams) {
  const user = await getRequiredUser();
  return <PatientNavigation user={user}>{props.children}</PatientNavigation>;
}
