import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type GlassCardVariantProps = {
  variant?: "light" | "dark" | "frosted" | "colored";
  color?: "primary" | "sage" | "lavender";
  blur?: "sm" | "md" | "lg";
  hover?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<"div">;

const blurSizes = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-xl",
};

export function GlassCardVariant({
  variant = "light",
  color = "primary",
  blur = "md",
  hover = false,
  className,
  children,
  ...props
}: GlassCardVariantProps) {
  const variantClasses = {
    light:
      "bg-white/70 border-white/50 dark:bg-gray-900/50 dark:border-gray-700/50",
    dark: "bg-gray-900/70 border-gray-700/50 text-white",
    frosted:
      "bg-white/30 border-white/20 dark:bg-gray-900/30 dark:border-gray-700/20",
    colored: {
      primary: "bg-[#2BA09F]/10 border-[#2BA09F]/30",
      sage: "bg-[#48A878]/10 border-[#48A878]/30",
      lavender: "bg-[#D4C5E8]/30 border-[#D4C5E8]/50",
    },
  };

  const bgClass =
    variant === "colored"
      ? variantClasses.colored[color]
      : variantClasses[variant];

  return (
    <div
      className={cn(
        "rounded-2xl border",
        blurSizes[blur],
        bgClass,
        hover &&
          "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
