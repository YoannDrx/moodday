import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getI18n } from "@/i18n/server";
import { getRequiredUser } from "@/lib/auth/auth-user";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function PricingSuccessPage() {
  const { t } = await getI18n();
  await getRequiredUser();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            {t("account.billing.success.title")}
          </CardTitle>
          <CardDescription>
            {t("account.billing.success.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4 pt-4">
            <Button asChild>
              <Link href="/pricing">{t("account.billing.manage")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t("account.billing.goDashboard")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
