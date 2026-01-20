import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AccountLayout } from "../account-layout";
import { DeleteAccountForm } from "./delete-account-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("account.danger.title"),
    description: t("account.danger.description"),
  };
});

export default async function DeleteProfilePage() {
  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <DeleteAccountForm />
      </div>
    </AccountLayout>
  );
}
