import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import { PatientNavigation } from "../_navigation/patient-navigation";

export default async function PatientLayout(props: LayoutParams) {
  await getRequiredUser();
  return <PatientNavigation>{props.children}</PatientNavigation>;
}
