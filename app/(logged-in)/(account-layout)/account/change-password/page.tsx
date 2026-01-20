import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AccountLayout } from "../account-layout";
import { ChangePasswordForm } from "./change-password-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("account.password.title"),
    description: t("account.password.description"),
  };
});

export default async function ChangePasswordPage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <ChangePasswordForm />
      </div>
    </AccountLayout>
  );
}
