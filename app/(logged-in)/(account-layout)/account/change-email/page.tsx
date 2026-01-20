import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AccountLayout } from "../account-layout";
import { ChangeEmailForm } from "./change-email-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("account.email.changeTitle"),
    description: t("account.email.changeDescription"),
  };
});

export default async function ChangeEmailPage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <ChangeEmailForm />
      </div>
    </AccountLayout>
  );
}
