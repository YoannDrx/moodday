import { Button } from "@/components/ui/button";
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

type Error401Props = PropsWithChildren<{
  title?: string;
}>;

export async function Error401(props: Error401Props) {
  const { t } = await getI18n();

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="flex flex-col">
        <Typography variant="code">401</Typography>
        <CardTitle>{props.title ?? t("error.unauthorized.title")}</CardTitle>
        <CardDescription>{t("error.unauthorized.description")}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-row gap-2">
        <ContactSupportDialog />
        <Button asChild>
          <Link href="/auth/signin">{t("auth.signIn.submit")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
