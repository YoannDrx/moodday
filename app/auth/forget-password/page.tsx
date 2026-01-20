import { SiteConfig } from "@/site-config";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ForgetPasswordPage } from "./forget-password-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.forgetPassword.metaTitle", { app: SiteConfig.title }),
    description: t("auth.forgetPassword.metaDescription"),
  };
}

export default async function ForgetPassword() {
  return <ForgetPasswordPage />;
}
