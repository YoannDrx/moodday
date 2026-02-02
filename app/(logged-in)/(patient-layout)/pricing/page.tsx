import {
  Layout,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { Pricing } from "@/features/plans/pricing-section";
import { getI18n } from "@/i18n/server";
import { getUserActiveSubscription } from "@/lib/user/get-user-subscription";
import { UserBilling } from "@app/(logged-in)/(account-layout)/account/billing/user-billing";

export default async function PricingPage() {
  const { t } = await getI18n();
  const subscription = await getUserActiveSubscription();

  if (subscription) {
    return (
      <>
        <UserBilling subscription={subscription} />
        <Pricing />
      </>
    );
  }

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
