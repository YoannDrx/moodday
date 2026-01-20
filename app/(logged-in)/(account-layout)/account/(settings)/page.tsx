import { getRequiredUser } from "@/lib/auth/auth-user";
import { combineWithParentMetadata } from "@/lib/metadata";
import { getI18n } from "@/i18n/server";
import { AccountLayout } from "../account-layout";
import { EditProfileCardForm } from "./edit-profile-form";

export const generateMetadata = combineWithParentMetadata(async () => {
  const { t } = await getI18n();
  return {
    title: t("account.profile.editTitle"),
    description: t("account.profile.editDescription"),
  };
});

export default async function EditProfilePage() {
  const user = await getRequiredUser();

  return (
    <AccountLayout>
      <div className="flex flex-col gap-4 lg:gap-8">
        <EditProfileCardForm defaultValues={user} />
      </div>
    </AccountLayout>
  );
}
