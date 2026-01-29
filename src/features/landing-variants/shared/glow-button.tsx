"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type GlowButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "sage" | "lavender" | "dark";
  size?: "sm" | "md" | "lg";
  glowIntensity?: "subtle" | "medium" | "strong";
} & Omit<ComponentPropsWithoutRef<"button">, "className">;

const variants = {
  primary: {
    bg: "bg-[#2BA09F]",
    hover: "hover:bg-[#2A8FA8]",
    glow: "rgba(43, 160, 159, VAR)",
    text: "text-white",
  },
  sage: {
    bg: "bg-[#48A878]",
    hover: "hover:bg-[#3A956E]",
    glow: "rgba(72, 168, 120, VAR)",
    text: "text-white",
  },
  lavender: {
    bg: "bg-[#D4C5E8]",
    hover: "hover:bg-[#B8A5D6]",
    glow: "rgba(212, 197, 232, VAR)",
    text: "text-gray-900",
  },
  dark: {
    bg: "bg-gray-900",
    hover: "hover:bg-gray-800",
    glow: "rgba(61, 165, 184, VAR)",
    text: "text-white",
  },
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const glowIntensities = {
  subtle: 0.2,
  medium: 0.4,
  strong: 0.6,
};

export function GlowButton({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  glowIntensity = "medium",
  ...props
}: GlowButtonProps) {
  const v = variants[variant];
  const glowColor = v.glow.replace(
    "VAR",
    String(glowIntensities[glowIntensity]),
  );

  const classes = cn(
    "relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300",
    v.bg,
    v.hover,
    v.text,
    sizes[size],
    "hover:scale-105 active:scale-[0.98]",
    className,
  );

  const style = {
    boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor.replace(String(glowIntensities[glowIntensity]), String(glowIntensities[glowIntensity] / 2))}`,
  };

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} style={style} {...props}>
      {children}
    </button>
  );
}
