import { redirect } from "next/navigation";

export default function MailProfilePage() {
  redirect("/settings?tab=notifications");
}
