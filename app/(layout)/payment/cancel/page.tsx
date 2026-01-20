import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import Link from "next/link";

export default async function CancelPaymentPage() {
  const { t } = await getI18n();

  return (
    <Layout>
      <LayoutHeader>
        <Badge variant="outline">{t("payment.cancel.badge")}</Badge>
        <LayoutTitle>{t("payment.cancel.title")}</LayoutTitle>
        <LayoutDescription>
          {t("payment.cancel.lineOne")}
          <br /> {t("payment.cancel.lineTwo")} <br />
          {t("payment.cancel.lineThree")}
          <br />
          {t("payment.cancel.lineFour")}
        </LayoutDescription>
      </LayoutHeader>
      <LayoutContent className="flex items-center gap-2">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          {t("nav.home")}
        </Link>
        <ContactSupportDialog />
      </LayoutContent>
    </Layout>
  );
}
