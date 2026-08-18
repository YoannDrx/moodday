import { getFeatureAvailability } from "@/lib/features/availability";
import type { LayoutParams } from "@/types/next";
import { notFound } from "next/navigation";

export default async function CaregiverLayout(props: LayoutParams) {
  if (!getFeatureAvailability("caregiverSharing").enabled) {
    notFound();
  }

  return props.children;
}
