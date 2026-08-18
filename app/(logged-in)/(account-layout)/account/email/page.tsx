import { getFeatureAvailability } from "@/lib/features/availability";
import { redirect } from "next/navigation";

export default function MailProfilePage() {
  redirect(
    getFeatureAvailability("pushNotifications").enabled
      ? "/settings/notifications"
      : "/settings/profile",
  );
}
