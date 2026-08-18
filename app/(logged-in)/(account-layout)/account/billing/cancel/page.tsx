import { redirect } from "next/navigation";

export default function LegacyCancelSubscriptionPage() {
  redirect("/settings/subscription");
}
