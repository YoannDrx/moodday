import { cn } from "@/lib/utils";
import { CalendarHeart } from "lucide-react";
import Link from "next/link";

type MooddayLogoProps = {
  size?: "sm" | "default" | "lg" | "xl";
  showText?: boolean;
  href?: string;
  className?: string;
};

const sizeConfig = {
  sm: {
    container: "size-8",
    icon: "size-4",
    text: "text-lg",
  },
  default: {
    container: "size-10",
    icon: "size-5",
    text: "text-xl",
  },
  lg: {
    container: "size-12",
    icon: "size-6",
    text: "text-2xl",
  },
  xl: {
    container: "size-14",
    icon: "size-7",
    text: "text-3xl",
  },
};

export function MooddayLogo({
  size = "default",
  showText = true,
  href = "/",
  className,
}: MooddayLogoProps) {
  const config = sizeConfig[size];

  const content = (
    <>
      <div
        className={cn(
          "bg-primary shadow-soft flex items-center justify-center rounded-xl transition-transform group-hover:rotate-6",
          config.container,
        )}
      >
        <CalendarHeart className={cn("text-white", config.icon)} />
      </div>
      {showText && (
        <span
          className={cn("text-primary font-bold tracking-tight", config.text)}
        >
          Moodday
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("group flex items-center gap-2", className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cn("group flex items-center gap-2", className)}>
      {content}
    </div>
  );
}
