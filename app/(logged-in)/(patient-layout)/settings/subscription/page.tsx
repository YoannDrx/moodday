import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";

import { SubscriptionContent } from "./_components/subscription-content";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("settings.subscription.title"),
    description: t("settings.subtitle"),
  };
});

export default function SubscriptionPage() {
  return <SubscriptionContent />;
}
