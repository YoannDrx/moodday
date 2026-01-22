"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Heart,
  HeartHandshake,
  Pill,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Icon mapping for QuickAccessCard (to pass icon names as strings from Server Components)
const iconMap: Record<string, LucideIcon> = {
  Heart,
  Pill,
  BarChart3,
  FileText,
  HeartHandshake,
};

// ═══════════════════════════════════════════════════════════════
// PageHeader - Header with title, description and optional action
// ═══════════════════════════════════════════════════════════════

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: LucideIcon;
  };
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-start justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button
          asChild={!!action.href}
          onClick={action.onClick}
          variant="default"
        >
          {action.href ? (
            <Link href={action.href}>
              {action.icon && <action.icon className="mr-2 size-4" />}
              {action.label}
            </Link>
          ) : (
            <>
              {action.icon && <action.icon className="mr-2 size-4" />}
              {action.label}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CtaCard - Call to action card with link
// ═══════════════════════════════════════════════════════════════

type CtaCardProps = {
  title: string;
  description: string;
  href: string;
  icon?: LucideIcon;
  color?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
};

const ctaColorClasses = {
  default: "bg-muted/50 hover:bg-muted/80",
  primary: "bg-primary/10 hover:bg-primary/20 border-primary/20",
  success: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
  warning: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20",
  danger: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
};

const ctaIconColorClasses = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-green-500",
  warning: "text-yellow-500",
  danger: "text-red-500",
};

export function CtaCard({
  title,
  description,
  href,
  icon: Icon,
  color = "default",
  className,
}: CtaCardProps) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "cursor-pointer border transition-all hover:shadow-md",
          ctaColorClasses[color],
          className,
        )}
      >
        <CardContent className="flex items-center gap-4 p-4">
          {Icon && (
            <div className="bg-background rounded-full p-3">
              <Icon className={cn("size-6", ctaIconColorClasses[color])} />
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <ArrowRight className="text-muted-foreground size-5" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════
// QuickAccessCard - Compact quick access link
// ═══════════════════════════════════════════════════════════════

type QuickAccessCardProps = {
  title: string;
  subtitle?: string;
  href: string;
  iconName: keyof typeof iconMap;
  className?: string;
};

export function QuickAccessCard({
  title,
  subtitle,
  href,
  iconName,
  className,
}: QuickAccessCardProps) {
  const Icon = iconMap[iconName] ?? FileText;

  return (
    <Link href={href}>
      <Card
        className={cn(
          "hover:bg-muted/50 cursor-pointer transition-colors",
          className,
        )}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <Icon className="text-muted-foreground size-5" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{title}</p>
            {subtitle && (
              <p className="text-muted-foreground truncate text-xs">
                {subtitle}
              </p>
            )}
          </div>
          <ArrowRight className="text-muted-foreground size-4 shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════
// EmptyState - Empty state with icon, title and optional action
// ═══════════════════════════════════════════════════════════════

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
};

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className,
      )}
    >
      <div className="bg-muted/50 mb-4 rounded-full p-4">
        <Icon className="text-muted-foreground size-8" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          asChild={!!action.href}
          onClick={action.onClick}
          variant="default"
          className="mt-4"
        >
          {action.href ? (
            <Link href={action.href}>{action.label}</Link>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SectionTitle - Section title with optional "see all" link
// ═══════════════════════════════════════════════════════════════

type SectionTitleProps = {
  title: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  className?: string;
};

export function SectionTitle({
  title,
  seeAllHref,
  seeAllLabel = "Voir tout",
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="text-muted-foreground hover:text-foreground flex items-center text-sm"
        >
          {seeAllLabel}
          <ArrowRight className="ml-1 size-4" />
        </Link>
      )}
    </div>
  );
}
