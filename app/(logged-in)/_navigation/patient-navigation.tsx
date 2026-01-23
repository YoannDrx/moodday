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

export async function PatientNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <PatientSidebar />
      <SidebarInset className="bg-[var(--sidebar-patient)]">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto hidden md:flex">
              <SyncIndicator />
            </div>
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 pb-20 md:pb-4">
          {children}
        </div>
      </SidebarInset>
      <QuickEntryModal />
      <PatientMobileNav />
    </SidebarProvider>
  );
}
