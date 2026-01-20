import {
  Layout,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Pricing } from "@/features/plans/pricing-section";
import { getI18n } from "@/i18n/server";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getUserActiveSubscription } from "@/lib/user/get-user-subscription";
import type { PageParams } from "@/types/next";
import type { ResolvingMetadata } from "next";
import { UserBilling } from "./user-billing";

export const generateMetadata = async (
  params: PageParams,
  parent: ResolvingMetadata,
) => {
  const { t } = await getI18n();

  return combineWithParentMetadata({
    title: t("account.billing.metaTitle"),
    description: t("account.billing.metaDescription"),
  })(params, parent);
};

export default async function OrgBillingPage() {
  const { t } = await getI18n();
  const subscription = await getUserActiveSubscription();

  if (!subscription) {
    return (
      <>
        <Layout size="lg">
          <LayoutHeader>
            <LayoutTitle>{t("account.billing.freeTitle")}</LayoutTitle>
            <LayoutDescription>
              {t("account.billing.freeDescription")}
            </LayoutDescription>
          </LayoutHeader>
        </Layout>
        <Pricing />
      </>
    );
  }

  return <UserBilling subscription={subscription} />;
}
