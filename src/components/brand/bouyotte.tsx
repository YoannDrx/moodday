import { cn } from "@/lib/utils";

export type BouyotteMood =
  | "ok"
  | "fragile"
  | "hard"
  | "very_hard"
  | "happy"
  | "sleepy"
  | "wink";

const bodyColor: Record<BouyotteMood, string> = {
  ok: "var(--mint)",
  fragile: "var(--honey)",
  hard: "var(--apricot)",
  very_hard: "var(--plum-soft)",
  happy: "var(--honey)",
  sleepy: "var(--plum-soft)",
  wink: "var(--apricot)",
};

const Face = ({ mood }: { mood: BouyotteMood }) => {
  const stroke = {
    stroke: "#2b1b30",
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    fill: "none",
  };
  switch (mood) {
    case "ok":
    case "happy":
      return (
        <>
          <circle cx="46" cy="72" r="4.5" fill="#2b1b30" />
          <circle cx="74" cy="72" r="4.5" fill="#2b1b30" />
          <path d="M48 84 Q60 96 72 84" {...stroke} />
          {mood === "happy" && (
            <>
              <circle cx="38" cy="84" r="5" fill="#f39a62" opacity="0.6" />
              <circle cx="82" cy="84" r="5" fill="#f39a62" opacity="0.6" />
            </>
          )}
        </>
      );
    case "fragile":
      return (
        <>
          <circle cx="46" cy="73" r="4" fill="#2b1b30" />
          <circle cx="74" cy="73" r="4" fill="#2b1b30" />
          <path d="M52 88 L68 88" {...stroke} />
          <circle cx="38" cy="83" r="5" fill="#f39a62" opacity="0.55" />
          <circle cx="82" cy="83" r="5" fill="#f39a62" opacity="0.55" />
        </>
      );
    case "hard":
      return (
        <>
          <path d="M40 64 L51 68" {...stroke} />
          <path d="M80 64 L69 68" {...stroke} />
          <circle cx="46" cy="74" r="4" fill="#2b1b30" />
          <circle cx="74" cy="74" r="4" fill="#2b1b30" />
          <path d="M48 90 Q54 85 60 90 Q66 95 72 90" {...stroke} />
        </>
      );
    case "very_hard":
    case "sleepy":
      return (
        <>
          <path d="M40 74 Q46 79 52 74" {...stroke} />
          <path d="M68 74 Q74 79 80 74" {...stroke} />
          <path d="M54 90 Q60 86 66 90" {...stroke} />
          {mood === "very_hard" && (
            <path
              d="M86 98 c0-5 7-5 7 0 c0-5 7-5 7 0 c0 5-7 9-7 9 c0 0-7-4-7-9z"
              fill="#f39a62"
              stroke="#2b1b30"
              strokeWidth="2"
            />
          )}
        </>
      );
    case "wink":
      return (
        <>
          <path d="M40 72 Q46 67 52 72" {...stroke} />
          <circle cx="74" cy="72" r="4.5" fill="#2b1b30" />
          <path d="M48 84 Q60 96 72 84" {...stroke} />
        </>
      );
  }
};

/**
 * Bouyotte, the Moodday hot-water bottle. Decorative by default: pass a
 * `label` only when the drawing carries meaning on its own. Never shown on
 * crisis screens.
 */
export function Bouyotte({
  mood = "happy",
  className,
  label,
  steam = false,
}: {
  mood?: BouyotteMood;
  className?: string;
  label?: string;
  steam?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 120 150"
      className={cn("shrink-0", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {steam && (
        <g
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        >
          <path
            className="animate-steam"
            d="M50 14 q-6 -6 0 -12"
            style={{ animationDelay: "0s" }}
          />
          <path
            className="animate-steam"
            d="M70 14 q6 -6 0 -12"
            style={{ animationDelay: "0.9s" }}
          />
        </g>
      )}
      <rect
        x="49"
        y="16"
        width="22"
        height="14"
        rx="4"
        fill="var(--plum)"
        stroke="#2b1b30"
        strokeWidth="3"
      />
      <path
        d="M44 30 h32 v10 h-32z"
        fill={bodyColor[mood]}
        stroke="#2b1b30"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="12"
        y="38"
        width="96"
        height="106"
        rx="32"
        fill={bodyColor[mood]}
        stroke="#2b1b30"
        strokeWidth="3.5"
      />
      {/* knitted rib at the bottom of the cover */}
      <g
        stroke="#2b1b30"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      >
        <path
          d="M26 116 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0"
          fill="none"
        />
        <path
          d="M30 128 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0 q6 6 12 0"
          fill="none"
        />
      </g>
      <Face mood={mood} />
    </svg>
  );
}
