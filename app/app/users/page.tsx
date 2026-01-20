import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";

export default async function AppUsersPage() {
  const { t } = await getI18n();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("nav.analytics")}</LayoutTitle>
      </LayoutHeader>
      <LayoutContent className="flex flex-col gap-4 lg:gap-8">
        <div className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">{t("app.analytics.title")}</h3>
          <p className="text-muted-foreground mt-2">
            {t("app.analytics.description")}
          </p>
        </div>
      </LayoutContent>
    </Layout>
  );
}
