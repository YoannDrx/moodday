import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { CancelSubscriptionForm } from "./cancel-form";

export default async function CancelSubscriptionPage() {
  const { t } = await getI18n();
  await getRequiredUser();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("account.billing.cancelTitle")}</LayoutTitle>
        <LayoutDescription>
          {t("account.billing.cancelDescription")}
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent>
        <CancelSubscriptionForm />
      </LayoutContent>
    </Layout>
  );
}
