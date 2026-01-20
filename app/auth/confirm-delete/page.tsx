import { SiteConfig } from "@/site-config";
import type { PageParams } from "@/types/next";
import type { Metadata } from "next";
import { getI18n } from "@/i18n/server";
import { ConfirmDeletePage } from "./confirm-delete-page";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.confirmDelete.metaTitle", { app: SiteConfig.title }),
    description: t("auth.confirmDelete.metaDescription"),
  };
}

export default async function ConfirmDelete(props: PageParams) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string | undefined;
  const callbackUrl = searchParams.callbackUrl as string | undefined;

  return <ConfirmDeletePage token={token} callbackUrl={callbackUrl} />;
}
