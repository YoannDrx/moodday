import { buttonVariants } from "@/components/ui/button";
import { Header } from "@/features/layout/header";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import type { PageParams } from "@/types/next";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();

  return {
    title: t("auth.newUser.metaTitle", { app: SiteConfig.title }),
    description: t("auth.newUser.metaDescription"),
  };
}

/**
 * This page is show when a user login. You can add an onboarding process here.
 */
export default async function NewUserPage(props: PageParams) {
  const { t } = await getI18n();
  const searchParams = await props.searchParams;
  const callbackUrl =
    typeof searchParams.callbackUrl === "string"
      ? searchParams.callbackUrl
      : "/";

  redirect(callbackUrl);

  return (
    <>
      <Header />
      <Layout>
        <LayoutHeader>
          <LayoutTitle>{t("auth.newUser.title")}</LayoutTitle>
          <LayoutDescription>{t("auth.newUser.description")}</LayoutDescription>
        </LayoutHeader>
        <LayoutContent>
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            {t("auth.newUser.cta")}
          </Link>
        </LayoutContent>
      </Layout>
    </>
  );
}
