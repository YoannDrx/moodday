import { combineWithParentMetadata } from "@/lib/metadata";

import { CaregiverContent } from "./_components/caregiver-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  return {
    title: "Cercle d'aidants",
    description: "Observations et événements en tant qu'aidant",
  };
});

export default function CaregiverPage() {
  return <CaregiverContent />;
}
