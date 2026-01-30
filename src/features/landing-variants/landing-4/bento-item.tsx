import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type BentoItemProps = {
  variant?: "light" | "primary" | "sage" | "lavender" | "dark" | "gradient";
  hover?: boolean;
} & ComponentPropsWithoutRef<"div">;

const variants = {
  light: "bg-white border border-gray-100",
  primary: "bg-gradient-to-br from-[#2BA09F] to-[#2A8FA8]",
  sage: "bg-gradient-to-br from-[#48A878] to-[#3A956E]",
  lavender: "bg-[#D4C5E8]/30 border border-[#D4C5E8]/50",
  dark: "bg-gray-900",
  gradient: "bg-gradient-to-br from-[#2BA09F] via-[#48A878] to-[#6FBD94]",
};

export function BentoItem({
  variant = "light",
  hover = false,
  className,
  children,
  ...props
}: BentoItemProps) {
  return (
    <div
      className={cn(
        "rounded-3xl p-6 transition-all duration-300",
        variants[variant],
        hover && "hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
