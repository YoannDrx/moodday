import { AutomaticPagination } from "@/components/nowts/automatic-pagination";
import { Typography } from "@/components/nowts/typography";
import { ItemGroup } from "@/components/ui/item";
import { getI18n } from "@/i18n/server";
import { getFeedbackList } from "@/query/feedback/get-feedback";
import { FeedbackItem } from "./feedback-row";

type FeedbackTableProps = {
  searchParams: {
    page: number;
    search: string;
  };
};

export const FeedbackTable = async ({ searchParams }: FeedbackTableProps) => {
  const { t } = await getI18n();
  const pageSize = 10;
  const currentPage = searchParams.page;

  const result = await getFeedbackList({
    page: currentPage,
    pageSize,
    search: searchParams.search || undefined,
  });

  const { feedback, totalPages } = result;

  if (feedback.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Typography variant="muted">{t("admin.feedback.empty")}</Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ItemGroup className="gap-2">
        {feedback.map((item) => (
          <FeedbackItem key={item.id} feedback={item} />
        ))}
      </ItemGroup>

      <AutomaticPagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchParam={searchParams.search}
        paramName="page"
      />
    </div>
  );
};
