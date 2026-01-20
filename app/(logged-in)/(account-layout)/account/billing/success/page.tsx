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
import { combineWithParentMetadata } from "@/lib/metadata";
import type { PageParams } from "@/types/next";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import type { ResolvingMetadata } from "next";
import { AccountLayout } from "../../account-layout";

export const generateMetadata = async (
  params: PageParams,
  parent: ResolvingMetadata,
) => {
  const { t } = await getI18n();
  return combineWithParentMetadata({
    title: t("account.billing.success.metaTitle"),
    description: t("account.billing.success.metaDescription"),
  })(params, parent);
};

export default async function SubscriptionSuccessPage() {
  const { t } = await getI18n();
  await getRequiredUser();

  return (
    <AccountLayout>
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
          <div className="space-y-4">
            <div className="flex justify-center gap-4 pt-4">
              <Button asChild>
                <Link href={`/account/billing`}>
                  {t("account.billing.manage")}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/account`}>
                  {t("account.billing.goDashboard")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
