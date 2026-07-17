import type { LayoutParams } from "@/types/next";
import { getRequiredAdmin } from "@/lib/auth/auth-user";
import { AdminNavigation } from "./_navigation/admin-navigation";

export default async function AdminLayout(props: LayoutParams) {
  await getRequiredAdmin();

  return <AdminNavigation>{props.children}</AdminNavigation>;
}
