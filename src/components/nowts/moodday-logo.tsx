import { cn } from "@/lib/utils";
import { MoodDayMark } from "@/components/svg/moodday-mark";
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
          "shadow-soft flex items-center justify-center rounded-[32%] bg-[#155c5a] transition-transform group-hover:scale-[1.03] group-hover:-rotate-2 motion-reduce:transform-none",
          config.container,
        )}
      >
        <MoodDayMark
          className={cn("text-[#fff8eb]", config.icon)}
          accentColor="#F3C9A8"
        />
      </div>
      {showText && (
        <span
          className={cn("text-primary font-bold tracking-tight", config.text)}
        >
          Mood Day
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
