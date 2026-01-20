import { SiteConfig } from "@/site-config";
import type { PageParams } from "@/types/next";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ResetPasswordPage } from "./reset-password-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.resetPassword.metaTitle", { app: SiteConfig.title }),
    description: t("auth.resetPassword.metaDescription"),
  };
}

export default async function RoutePage(props: PageParams) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string;

  return <ResetPasswordPage token={token} />;
}
