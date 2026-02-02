import { redirect } from "next/navigation";

export default function DeleteProfilePage() {
  redirect("/settings?tab=privacy");
}
