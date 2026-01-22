import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { crisisResources } from "@/lib/design-tokens";

import { CrisisContent } from "./_components/crisis-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  return {
    title: "Soutien en cas de crise",
    description: "Numéros et ressources d'aide en cas de détresse",
  };
});

export default async function CrisisPage() {
  const { locale } = await getI18n();
  const lang = locale === "fr" ? "fr" : "en";

  // Map resources with localized descriptions
  const localizedResources = crisisResources.map((r) => ({
    ...r,
    description: r.description?.[lang],
  }));

  const hotlines = localizedResources.filter((r) => r.category === "hotline");
  const emergency = localizedResources.filter(
    (r) => r.category === "emergency",
  );
  const support = localizedResources.filter((r) => r.category === "support");

  return (
    <CrisisContent
      hotlines={hotlines}
      emergency={emergency}
      support={support}
    />
  );
}
