import { AutomaticPagination } from "@/components/nowts/automatic-pagination";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getI18n } from "@/i18n/server";
import { getUsersWithStats } from "../_actions/admin-users";
import { UserRow } from "./user-row";

type UserTableProps = {
  searchParams: {
    page: number;
    search: string;
  };
};

export const UserTable = async ({ searchParams }: UserTableProps) => {
  const { t } = await getI18n();
  const pageSize = 10;
  const currentPage = searchParams.page;

  const { users, totalPages } = await getUsersWithStats({
    page: currentPage,
    pageSize,
    search: searchParams.search || undefined,
  });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("admin.users.table.user")}</TableHead>
            <TableHead>{t("admin.users.table.role")}</TableHead>
            <TableHead>{t("admin.users.table.created")}</TableHead>
            <TableHead>{t("admin.users.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>

      <AutomaticPagination
        currentPage={currentPage}
        totalPages={totalPages}
        searchParam={searchParams.search}
        paramName="page"
      />
    </>
  );
};
