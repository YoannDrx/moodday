import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import Link from "next/link";
import { Typography } from "../../components/nowts/typography";
import { buttonVariants } from "../../components/ui/button";
import { getI18n } from "@/i18n/server";

export async function Page404() {
  const { t } = await getI18n();

  return (
    <main className="flex h-full flex-col items-center justify-center gap-8">
      <div className="space-y-3 text-center">
        <Typography variant="code">404</Typography>
        <Typography variant="h1">{t("error.notFound.title")}</Typography>
        <Typography>{t("error.notFound.description")}</Typography>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          {t("error.notFound.cta")}
        </Link>
        <ContactSupportDialog />
      </div>
    </main>
  );
}
