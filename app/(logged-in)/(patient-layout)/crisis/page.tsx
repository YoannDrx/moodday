import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { crisisResources } from "@/lib/design-tokens";

import { CrisisContent } from "./_components/crisis-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("crisis.metaTitle"),
    description: t("crisis.metaDescription"),
  };
});

export default async function CrisisPage() {
  const { t } = await getI18n();

  // Map resources with localized descriptions
  const localizedResources = crisisResources.map((r) => ({
    ...r,
    name: t(r.nameKey),
    description: r.descriptionKey ? t(r.descriptionKey) : undefined,
    available: r.availabilityKey ? t(r.availabilityKey) : undefined,
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
