"use client";

import { Typography } from "@/components/nowts/typography";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarNavigationMenu } from "@/components/ui/sidebar-utils";
import type { NavigationGroup } from "@/features/navigation/navigation.type";
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import { useI18n } from "@/i18n/provider";
import { ChevronDown } from "lucide-react";
import { getAccountNavigation } from "./account.links";

export function AccountSidebar() {
  const { t } = useI18n();
  const links: NavigationGroup[] = getAccountNavigation(t);

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <Typography variant="large">{t("account.title")}</Typography>
      </SidebarHeader>
      <SidebarContent>
        {links.map((link) => (
          <SidebarGroup key={link.title}>
            <SidebarGroupLabel>
              {link.title}
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNavigationMenu link={link} />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2">
        <SidebarUserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
