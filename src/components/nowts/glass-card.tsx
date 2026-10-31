"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "subtle";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

const variantClasses = {
  default: "sticker",
  elevated: "sticker",
  subtle: "bg-card border-2 border-dashed border-[var(--ink)]/40",
};

/**
 * GlassCard - A card component with glassmorphism effect
 *
 * Based on the Moodday design system:
 * - Frosted glass background
 * - Soft blur effect
 * - Subtle border
 * - Large border radius (32px)
 *
 * @example
 * ```tsx
 * <GlassCard padding="lg">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px]",
        variantClasses[variant],
        paddingClasses[padding],
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

type GlassCardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCardHeader({ children, className }: GlassCardHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

type GlassCardTitleProps = {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function GlassCardTitle({
  children,
  icon,
  className,
}: GlassCardTitleProps) {
  return (
    <h3
      className={cn(
        "font-display flex items-center gap-2 text-xl font-extrabold",
        className,
      )}
    >
      {icon}
      {children}
    </h3>
  );
}

type GlassCardBadgeProps = {
  children: ReactNode;
  variant?: "primary" | "sage" | "lavender" | "danger";
  className?: string;
};

const badgeVariantClasses = {
  primary: "bg-honey-soft text-foreground",
  sage: "bg-mint-soft text-foreground",
  lavender: "bg-plum-soft/50 text-foreground",
  danger: "bg-destructive/10 text-destructive",
};

export function GlassCardBadge({
  children,
  variant = "primary",
  className,
}: GlassCardBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full border-2 border-[var(--ink)] px-3 py-1 text-xs font-bold",
        badgeVariantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

type GlassCardContentProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCardContent({
  children,
  className,
}: GlassCardContentProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

type GlassCardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCardFooter({ children, className }: GlassCardFooterProps) {
  return <div className={cn("mt-6 flex gap-3", className)}>{children}</div>;
}
