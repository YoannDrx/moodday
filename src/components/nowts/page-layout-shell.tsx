import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MaxWidth = "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

export type PageLayoutAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
};

export type PageLayoutShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: PageLayoutAction;
  headerRight?: ReactNode;
  maxWidth?: MaxWidth;
  showBlobs?: boolean;
  blobVariant?: "lavender" | "sage";
  className?: string;
};

const maxWidthClasses: Record<MaxWidth, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function PageLayoutShell({
  children,
  title,
  subtitle,
  action,
  headerRight,
  maxWidth = "7xl",
  className,
}: PageLayoutShellProps) {
  const ActionIcon = action?.icon;

  return (
    <div className={cn("mx-auto pb-8", maxWidthClasses[maxWidth], className)}>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1 font-semibold">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {headerRight}
          {action && (
            <Button asChild={!!action.href} onClick={action.onClick}>
              {action.href ? (
                <Link href={action.href}>
                  {ActionIcon && <ActionIcon className="mr-2 size-4" />}
                  {action.label}
                </Link>
              ) : (
                <>
                  {ActionIcon && <ActionIcon className="mr-2 size-4" />}
                  {action.label}
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {children}
    </div>
  );
}
