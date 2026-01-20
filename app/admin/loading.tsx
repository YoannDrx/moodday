import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";

export default async function RouteLoading() {
  const { t } = await getI18n();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.dashboard.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
}
