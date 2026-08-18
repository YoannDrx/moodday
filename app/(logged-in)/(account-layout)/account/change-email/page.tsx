import { redirect } from "next/navigation";

export default function ChangeEmailPage() {
  redirect("/settings/security");
}
