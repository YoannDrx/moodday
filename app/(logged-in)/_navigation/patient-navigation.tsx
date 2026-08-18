import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Layout } from "@/features/page/layout";
import type { PropsWithChildren } from "react";
import { PatientMobileNav } from "./patient-mobile-nav";
import { PatientSidebar } from "./patient-sidebar";
import { QuickEntryModal } from "@/components/nowts/quick-entry-modal";
import { SyncIndicator } from "@/features/pwa/sync-indicator";
import { PatientBreadcrumb } from "./patient-breadcrumb";
import type { PatientNavigationFeatures } from "./patient-navigation.links";

type PatientNavigationProps = PropsWithChildren<{
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  features: PatientNavigationFeatures;
}>;

export async function PatientNavigation({
  children,
  user,
  features,
}: PatientNavigationProps) {
  return (
    <SidebarProvider>
      <PatientSidebar user={user} features={features} />
      <SidebarInset className="bg-gray-50/50">
        <header className="flex h-14 shrink-0 items-center gap-2 bg-white/80 backdrop-blur-sm">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-700" />
            <PatientBreadcrumb />
            <div className="ml-auto hidden md:flex">
              <SyncIndicator />
            </div>
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-20 md:pb-4">
          {children}
        </div>
      </SidebarInset>
      <QuickEntryModal />
      <PatientMobileNav />
    </SidebarProvider>
  );
}
