import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { Suspense } from "react";
import { AdminChartsSection } from "./_components/admin-charts-section";
import { AdminChartsSkeleton } from "./_components/admin-charts-skeleton";
import { AdminStatsSection } from "./_components/admin-stats-section";
import { AdminStatsSkeleton } from "./_components/admin-stats-skeleton";

export default async function Page() {
  return (
    <Suspense fallback={null}>
      <AdminPage />
    </Suspense>
  );
}

async function AdminPage() {
  const { t } = await getI18n();
  await getRequiredAdmin();

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.dashboard.title")}</LayoutTitle>
      </LayoutHeader>
      <LayoutContent>
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<AdminStatsSkeleton />}>
              <AdminStatsSection />
            </Suspense>
          </div>
          <Suspense fallback={<AdminChartsSkeleton />}>
            <AdminChartsSection />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}
