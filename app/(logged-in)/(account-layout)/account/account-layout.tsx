import { SubmitButton } from "@/features/form/submit-button";
import {
  Layout,
  LayoutActions,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

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
        <form>
          <SubmitButton
            formAction={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/");
            }}
          >
            {t("account.settings.signOut")}
          </SubmitButton>
        </form>
      </LayoutActions>
      <LayoutContent>{children}</LayoutContent>
    </Layout>
  );
}
