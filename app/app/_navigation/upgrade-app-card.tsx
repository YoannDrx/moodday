import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";
import { BILLING_URL } from "@/lib/LINKS";
import Link from "next/link";
import { useCurrentUser } from "./use-current-user";

export const UpgradeCard = () => {
  const user = useCurrentUser();
  const { t } = useI18n();

  if (!user) return null;

  return (
    <Card className="">
      <CardHeader className="">
        <CardTitle>{t("app.upgrade.title")}</CardTitle>
        <CardDescription>{t("app.upgrade.description")}</CardDescription>
      </CardHeader>
      <CardContent className="">
        <Link
          href={BILLING_URL}
          className={buttonVariants({ className: "w-full" })}
        >
          {t("app.upgrade.cta")}
        </Link>
      </CardContent>
    </Card>
  );
};
