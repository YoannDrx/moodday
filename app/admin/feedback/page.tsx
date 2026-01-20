import { Skeleton } from "@/components/ui/skeleton";
import {
  Layout,
  LayoutContent,
  LayoutDescription,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import type { PageProps } from "@/types/next";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { Suspense } from "react";
import { FeedbackFilters } from "./_components/feedback-filters";
import { FeedbackTable } from "./_components/feedback-table";

const feedbackSearchParams = {
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
};

const searchParamsCache = createSearchParamsCache(feedbackSearchParams);

export default async function Page(props: PageProps<"/admin/feedback">) {
  return (
    <Suspense fallback={null}>
      <AdminFeedbackPage {...props} />
    </Suspense>
  );
}

async function AdminFeedbackPage({
  searchParams,
}: PageProps<"/admin/feedback">) {
  const { t } = await getI18n();
  await getRequiredAdmin();

  const params = await searchParamsCache.parse(searchParams);

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.feedback.title")}</LayoutTitle>
        <LayoutDescription>{t("admin.feedback.description")}</LayoutDescription>
      </LayoutHeader>

      <LayoutContent>
        <div className="space-y-4">
          <FeedbackFilters />

          <Suspense fallback={<FeedbackTableSkeleton />}>
            <FeedbackTable searchParams={params} />
          </Suspense>
        </div>
      </LayoutContent>
    </Layout>
  );
}

const FeedbackTableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 10 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);
