"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useI18n } from "@/i18n/provider";
import { Home } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Fragment, useMemo } from "react";

const isDynamicSegment = (segment: string) =>
  /^[0-9a-fA-F-]{8,}$/.test(segment);

export function PatientBreadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const segments = pathname.split("/").filter(Boolean);
  const tabParam = searchParams.get("tab");

  const crumbs = useMemo(() => {
    const items: { label: string; href: string }[] = [];

    const labelMap: Record<string, string> = {
      dashboard: t("nav.dashboard"),
      mood: t("patient.nav.mood"),
      history: t("mood.history.title"),
      medications: t("patient.nav.medications"),
      today: t("medication.today.title"),
      exercises: t("patient.nav.exercises"),
      therapy: t("patient.nav.therapy"),
      caregiver: t("patient.nav.caregiver"),
      observe: t("caregiver.observe.title"),
      export: t("patient.nav.export"),
      trends: t("patient.nav.trends"),
      crisis: t("patient.nav.crisis"),
      settings: t("settings.title"),
      pricing: t("nav.pricing"),
      success: t("account.billing.success.title"),
      cancel: t("pricing.checkoutCanceled.title"),
    };

    const detailLabels: Record<string, string> = {
      medications: t("medication.detail.title"),
    };

    const newLabels: Record<string, string> = {
      medications: t("medication.add.title"),
      therapy: t("therapy.add.title"),
      exercises: t("exercise.add.title"),
    };

    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`;

      if (segment === "new") {
        const parent = segments[index - 1];
        const label = parent ? newLabels[parent] : null;
        if (label) items.push({ label, href });
        return;
      }

      if (segment === "edit") {
        items.push({ label: t("actions.edit"), href });
        return;
      }

      if (isDynamicSegment(segment)) {
        const parent = segments[index - 1];
        const label = parent ? detailLabels[parent] : null;
        if (label) items.push({ label, href });
        return;
      }

      const label = labelMap[segment];
      if (label) items.push({ label, href });
    });

    if (segments[0] === "settings" && tabParam) {
      const tabLabelMap: Record<string, string> = {
        profile: t("settings.tabs.profile"),
        notifications: t("settings.tabs.notifications"),
        appearance: t("settings.tabs.appearance"),
        privacy: t("settings.tabs.privacy"),
        subscription: t("settings.tabs.subscription"),
        security: t("settings.tabs.security"),
      };
      const tabLabel = tabLabelMap[tabParam];
      if (tabLabel) {
        items.push({ label: tabLabel, href: pathname });
      }
    }

    return items;
  }, [segments, t, pathname, tabParam]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs shadow-sm">
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <Home size={14} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{t("nav.dashboard")}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.href}-${index}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
