import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import type { PropsWithChildren } from "react";
import { AdminSidebar } from "./admin-sidebar";

export async function AdminNavigation({ children }: PropsWithChildren) {
  const { t } = await getI18n();

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger
              size="lg"
              variant="outline"
              className="size-9 cursor-pointer"
            />
            <span className="font-semibold">{t("admin.panel")}</span>
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
