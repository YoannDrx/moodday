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
import { CalendarHeart, ChevronDown, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import {
  getPatientNavigation,
  type PatientNavigationFeatures,
} from "./patient-navigation.links";
import Link from "next/link";

type PatientSidebarProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  features: PatientNavigationFeatures;
};

export function PatientSidebar({ user, features }: PatientSidebarProps) {
  const { t } = useI18n();
  const links = getPatientNavigation(t, features);
  const menuButtonClassName =
    "rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 data-[active=true]:bg-[var(--primary)] data-[active=true]:text-white data-[active=true]:shadow-lg data-[active=true]:shadow-[var(--primary)]/25";

  return (
    <Sidebar
      variant="inset"
      className="[&>[data-sidebar=sidebar]]:border-r [&>[data-sidebar=sidebar]]:border-gray-100 [&>[data-sidebar=sidebar]]:bg-[var(--sidebar-patient)]"
    >
      {/* Logo Header */}
      <SidebarHeader className="flex flex-row items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-teal-400 shadow-[var(--primary)]/20 shadow-lg">
          <CalendarHeart className="size-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">
          Moodday
        </span>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="px-3">
        {links.map((link) => (
          <ItemCollapsing
            defaultOpenStartPath={link.defaultOpenStartPath}
            key={link.title}
          >
            <SidebarGroup key={link.title}>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase transition-colors hover:text-gray-600">
                  {link.title}
                  <ChevronDown className="ml-auto size-3.5 text-gray-400 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarNavigationMenu
                    link={link}
                    buttonClassName={menuButtonClassName}
                  />
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </ItemCollapsing>
        ))}
      </SidebarContent>

      {/* Footer with CTA, SOS Card and User Button */}
      <SidebarFooter className="flex flex-col gap-3 border-t border-gray-100 p-4">
        {/* CTA Upgrade */}
        {features.billing && (
          <Button
            asChild
            className="w-full bg-gradient-to-r from-[var(--primary)] to-teal-400 text-white shadow-[var(--primary)]/20 shadow-md transition-all duration-200 hover:shadow-[var(--primary)]/30 hover:shadow-lg"
          >
            <Link href="/pricing">
              <Sparkles className="mr-2 size-4" />
              {t("settings.upgrade")}
            </Link>
          </Button>
        )}

        {/* SOS Crisis Card */}
        <div className="rounded-xl border border-red-200/60 bg-gradient-to-br from-red-50 to-red-100/50 p-3.5">
          <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-red-500 uppercase">
            {t("crisis.fab.needHelp")}
          </p>
          <a
            href="tel:3114"
            className="flex items-center justify-between text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            {t("crisis.fab.call")} <Phone className="size-4" />
          </a>
        </div>

        {/* User Button (contains logout via dropdown) */}
        <SidebarUserButton user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

const ItemCollapsing = (
  props: PropsWithChildren<{ defaultOpenStartPath?: string }>,
) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible
      defaultOpen={true}
      onOpenChange={setOpen}
      open={open}
      className="group/collapsible"
    >
      {props.children}
    </Collapsible>
  );
};
