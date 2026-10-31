import { cn } from "@/lib/utils";

/** Compact hot-water-bottle glyph, legible down to a 16 px favicon. */
export function MooddayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden>
      <rect x="12" y="2.5" width="8" height="5" rx="1.5" fill="var(--plum)" />
      <rect
        x="4"
        y="8"
        width="24"
        height="22"
        rx="8"
        fill="var(--honey)"
        stroke="var(--ink)"
        strokeWidth="2.2"
      />
      <circle cx="12.5" cy="17" r="1.6" fill="#2b1b30" />
      <circle cx="19.5" cy="17" r="1.6" fill="#2b1b30" />
      <path
        d="M12.5 21.5 q3.5 3 7 0"
        stroke="#2b1b30"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MooddayLogo({
  className,
  withText = true,
  size = "md",
}: {
  className?: string;
  withText?: boolean;
  size?: "sm" | "md" | "lg";
  /** Kept for call sites of the previous logo; the logo is never a link itself. */
  href?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 flex-wrap items-center gap-2",
        className,
      )}
    >
      <MooddayGlyph
        className={
          size === "lg"
            ? "size-9 sm:size-11"
            : size === "sm"
              ? "size-6"
              : "size-8"
        }
      />
      {withText && (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight",
            size === "lg"
              ? "text-2xl sm:text-3xl"
              : size === "sm"
                ? "text-lg"
                : "text-xl",
          )}
        >
          moodday
        </span>
      )}
      <span className="sr-only">Moodday</span>
    </span>
  );
}
