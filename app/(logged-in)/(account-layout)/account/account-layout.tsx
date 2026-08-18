import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import type { ReactNode } from "react";
import { AccountSignOutButton } from "./account-sign-out-button";

type AccountLayoutProps = {
  children: ReactNode;
};

export async function AccountLayout({ children }: AccountLayoutProps) {
  const { t } = await getI18n();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("account.settings.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutActions>
        <AccountSignOutButton label={t("account.settings.signOut")} />
      </LayoutActions>
      <LayoutContent>{children}</LayoutContent>
    </Layout>
  );
}
