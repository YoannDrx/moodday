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
  showBlobs = true,
  blobVariant = "lavender",
  className,
}: PageLayoutShellProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={cn(
        "mx-auto px-4 pb-8 lg:px-6",
        maxWidthClasses[maxWidth],
        className,
      )}
    >
      {showBlobs && (
        <>
          <div className="blob blob-primary -top-[200px] -left-[100px]" />
          <div
            className={cn(
              "blob -right-[100px] -bottom-[200px]",
              blobVariant === "lavender" ? "blob-lavender" : "blob-sage",
            )}
          />
        </>
      )}

      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="text-gray-600">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {headerRight}
          {action && (
            <Button
              asChild={!!action.href}
              onClick={action.onClick}
              className="shadow-soft rounded-2xl bg-[var(--primary)] px-6 font-bold text-white transition-all hover:bg-[var(--primary-dark)]"
            >
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
