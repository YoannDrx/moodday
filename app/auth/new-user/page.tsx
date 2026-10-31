import { redirect } from "next/navigation";

/** Shown right after sign-up: the onboarding picks the side of the duo. */
export default function NewUserPage() {
  redirect("/onboarding");
}
