import type { ComponentPropsWithoutRef } from "react";

export type MoodDayMarkVariant =
  | "calendar-heart"
  | "living-journal"
  | "continuity-thread";

type MoodDayMarkProps = ComponentPropsWithoutRef<"svg"> & {
  accentColor?: string;
  variant?: MoodDayMarkVariant;
};

export function MoodDayMark({
  accentColor = "#F3C9A8",
  variant = "calendar-heart",
  ...props
}: MoodDayMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      {variant === "calendar-heart" ? (
        <>
          <path
            d="M18 11h28a8 8 0 0 1 8 8v29a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V19a8 8 0 0 1 8-8Z"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M21 7v8M43 7v8M10 24h44"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="21" cy="34" r="2.25" fill="currentColor" />
          <circle cx="30" cy="34" r="2.25" fill="currentColor" />
          <circle cx="21" cy="43" r="2.25" fill="currentColor" />
          <path
            d="M42.5 51.5c-1.2-1.05-8.5-6.05-8.5-11.05a5.15 5.15 0 0 1 9-3.45 5.15 5.15 0 0 1 9 3.45c0 5-7.3 10-8.5 11.05a.76.76 0 0 1-1 0Z"
            fill={accentColor}
          />
        </>
      ) : null}

      {variant === "living-journal" ? (
        <>
          <path
            d="M8 18c9-3.5 17-1.5 24 5v31c-7-6.5-15-8.5-24-5V18Zm48 0c-9-3.5-17-1.5-24 5v31c7-6.5 15-8.5 24-5V18Z"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M13 35c7-4 13-3 19 2 6-5 12-6 19-2"
            stroke={accentColor}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M29.2 45.1c-1.9-1.55-4.2-3.6-4.2-6.1a3.35 3.35 0 0 1 6-2.05A3.35 3.35 0 0 1 37 39c0 2.5-2.3 4.55-4.2 6.1a2.8 2.8 0 0 1-3.6 0Z"
            fill="currentColor"
          />
        </>
      ) : null}

      {variant === "continuity-thread" ? (
        <>
          <circle cx="9" cy="40" r="5" fill={accentColor} />
          <circle cx="55" cy="40" r="5" fill="currentColor" opacity="0.38" />
          <path
            d="M14 40c8-11 16-12 22-5 3.7 4.35 1.15 10.7-4 10.7-6.5 0-9.7-8.6-5.8-14.35 4.2-6.2 13.7-5.7 17.3.8 3.15 5.7.5 12.1-5.2 15.4-6.5 3.75-13.15.95-18.3-2.55 8.5 9 22 10.5 35 1"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
    </svg>
  );
}
