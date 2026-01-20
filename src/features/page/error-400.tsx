import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Typography } from "../../components/nowts/typography";
import { ContactSupportDialog } from "../contact/support/contact-support-dialog";
import { getI18n } from "@/i18n/server";

type Page400Props = PropsWithChildren<{
  title?: string;
}>;

export async function Error400(props: Page400Props) {
  const { t } = await getI18n();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col">
        <Typography variant="code">400</Typography>
        <CardTitle>{props.title ?? t("error.badRequest.title")}</CardTitle>
        <CardDescription>{t("error.badRequest.description")}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-row gap-2">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          {t("error.badRequest.cta")}
        </Link>
        <ContactSupportDialog />
      </CardFooter>
    </Card>
  );
}
