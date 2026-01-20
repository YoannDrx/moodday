import { getRequiredUser } from "@/lib/auth/auth-user";
import type { LayoutParams } from "@/types/next";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { AccountNavigation } from "./account-navigation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("account.metaTitle"),
    description: t("account.metaDescription"),
  };
}

export default async function RouteLayout(props: LayoutParams) {
  await getRequiredUser();

  return <AccountNavigation>{props.children}</AccountNavigation>;
}
