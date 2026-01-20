import {
  Layout,
  LayoutContent,
  LayoutHeader,
  LayoutTitle,
} from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import type { PageProps } from "@/types/next";
import { getUsersWithStats } from "./_actions/admin-users";
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";
import { UsersList } from "./_components/users-list";

const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
});

export default async function Page(props: PageProps<"/admin/users">) {
  const { t } = await getI18n();
  await getRequiredAdmin();

  const { q, page } = await searchParamsCache.parse(props.searchParams);

  const pageSize = 10;
  const { users, total } = await getUsersWithStats({
    page,
    pageSize,
    search: q || undefined,
  });

  return (
    <Layout size="lg">
      <LayoutHeader>
        <LayoutTitle>{t("admin.users.title")}</LayoutTitle>
      </LayoutHeader>

      <LayoutContent>
        <UsersList
          users={users}
          total={total}
          limit={pageSize}
          currentPage={page}
        />
      </LayoutContent>
    </Layout>
  );
}
