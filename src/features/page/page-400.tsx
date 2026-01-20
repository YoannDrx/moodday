import { ContactSupportDialog } from "@/features/contact/support/contact-support-dialog";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Typography } from "../../components/nowts/typography";
import { buttonVariants } from "../../components/ui/button";
import { getI18n } from "@/i18n/server";

type Page400Props = PropsWithChildren<{
  title?: string;
}>;

export async function Page400(props: Page400Props) {
  const { t } = await getI18n();

  return (
    <main className="flex flex-col items-center gap-8">
      <div className="max-w-lg space-y-3 text-center">
        <Typography variant="code">400</Typography>
        <Typography variant="h1">
          {props.title ?? t("error.badRequest.title")}
        </Typography>
        {props.children ?? (
          <Typography>{t("error.badRequest.description")}</Typography>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          {t("error.badRequest.cta")}
        </Link>
        <ContactSupportDialog />
      </div>
    </main>
  );
}
