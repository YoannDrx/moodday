import { buttonVariants } from "@/components/ui/button";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import Link from "next/link";

export default async function SuccessPaymentPage() {
  const { t } = await getI18n();

  return (
    <>
      <Layout>
        <LayoutHeader>
          <LayoutTitle>{t("payment.success.title")}</LayoutTitle>
          <LayoutDescription>
            {t("payment.success.description")}
          </LayoutDescription>
        </LayoutHeader>
        <LayoutContent>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            {t("payment.success.cta")}
          </Link>
        </LayoutContent>
      </Layout>
    </>
  );
}
