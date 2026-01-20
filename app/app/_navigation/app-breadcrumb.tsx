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
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const { t } = useI18n();

  const paths = pathname.split("/").filter(Boolean);
  const basePath = "/app";
  const labelMap: Record<string, string> = {
    users: t("nav.analytics"),
  };

  return (
    <Breadcrumb>
      <BreadcrumbList className="border-border bg-background rounded-lg border px-3 py-2 shadow-sm shadow-black/5">
        <BreadcrumbItem>
          <BreadcrumbLink href={basePath}>
            <Home size={16} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{t("nav.home")}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {paths.slice(1).map((path, index) => {
          const isLast = index === paths.slice(1).length - 1;
          const currentPath = `/${paths.slice(0, index + 2).join("/")}`;

          const displayName = labelMap[path] ?? path;

          return (
            <Fragment key={path + index}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {displayName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={currentPath}
                    className="flex items-center gap-2"
                  >
                    {displayName}
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
