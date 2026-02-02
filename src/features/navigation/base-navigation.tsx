import { Typography } from "@/components/nowts/typography";
import { LogoSvg } from "@/components/svg/logo-svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarMenuButtonLink } from "@/components/ui/sidebar-utils";
import { LanguageToggle } from "@/features/i18n/language-toggle";
import { Layout } from "@/features/page/layout";
import { getI18n } from "@/i18n/server";
import { SiteConfig } from "@/site-config";
import { Building2, Home, User } from "lucide-react";
import type { PropsWithChildren } from "react";
import { SidebarUserButton } from "../sidebar/sidebar-user-button";

export async function BaseNavigation({ children }: PropsWithChildren) {
  return (
    <SidebarProvider id="app-sidebar">
      <BaseSidebar />
      <SidebarInset className="border-accent border">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <Layout size="lg" className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto">
              <LanguageToggle />
            </div>
          </Layout>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const BaseSidebar = async () => {
  const { t } = await getI18n();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="mb-4 flex flex-row items-center gap-2">
          <LogoSvg size={24} />
          <Typography>{SiteConfig.title}</Typography>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButtonLink href="/orgs">
              <Building2 />
              <span>{t("nav.organization")}</span>
            </SidebarMenuButtonLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButtonLink href="/home">
              <Home />
              <span>{t("nav.home")}</span>
            </SidebarMenuButtonLink>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButtonLink href="/settings?tab=profile">
              <User />
              <span>{t("nav.account")}</span>
            </SidebarMenuButtonLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
