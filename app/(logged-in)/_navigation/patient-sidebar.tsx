"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { SidebarUserButton } from "@/features/sidebar/sidebar-user-button";
import { useI18n } from "@/i18n/provider";
import { CalendarHeart, ChevronDown, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { getPatientNavigation } from "./patient-navigation.links";

export function PatientSidebar() {
  const { t } = useI18n();
  const links = getPatientNavigation(t);

  return (
    <Sidebar
      variant="inset"
      className="[&>[data-sidebar=sidebar]]:bg-white/50 [&>[data-sidebar=sidebar]]:backdrop-blur-md"
    >
      {/* Logo Header */}
      <SidebarHeader className="flex flex-row items-center gap-3 px-6 py-5">
        <div className="shadow-soft flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]">
          <CalendarHeart className="size-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-[var(--primary-darkest)]">
          Moodday
        </span>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-2">
        {links.map((link) => (
          <ItemCollapsing
            defaultOpenStartPath={link.defaultOpenStartPath}
            key={link.title}
          >
            <SidebarGroup key={link.title}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                  {link.title}
                  <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarNavigationMenu link={link} />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </ItemCollapsing>
        ))}
      </SidebarContent>

      {/* Footer with SOS Card and User Button */}
      <SidebarFooter className="flex flex-col gap-3 p-4">
        {/* SOS Crisis Card */}
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="mb-2 text-xs font-bold tracking-wider text-red-600 uppercase">
            Besoin d&apos;aide ?
          </p>
          <a
            href="tel:3114"
            className="flex items-center justify-between font-bold text-red-700 hover:underline"
          >
            SOS 3114 <Phone className="size-4" />
          </a>
        </div>

        {/* User Button */}
        <SidebarUserButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

const ItemCollapsing = (
  props: PropsWithChildren<{ defaultOpenStartPath?: string }>,
) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isOpen = props.defaultOpenStartPath
    ? pathname.startsWith(props.defaultOpenStartPath)
    : true;

  useEffect(() => {
    if (isOpen) {
      setOpen(isOpen);
    }
  }, [isOpen]);

  return (
    <Collapsible
      defaultOpen={isOpen}
      onOpenChange={setOpen}
      open={open}
      className="group/collapsible"
    >
      {props.children}
    </Collapsible>
  );
};
