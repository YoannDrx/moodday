import { cn } from "@/lib/utils";

type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
  gradient?: "primary" | "sage" | "lavender" | "rainbow" | "custom";
  customGradient?: string;
  animated?: boolean;
};

const gradients = {
  primary: "from-[#1D7680] via-[#2BA09F] to-[#3DA5B8]",
  sage: "from-[#3A956E] via-[#48A878] to-[#6FBD94]",
  lavender: "from-[#B8A5D6] via-[#D4C5E8] to-[#E8DFF5]",
  rainbow: "from-[#2BA09F] via-[#48A878] to-[#D4C5E8]",
  custom: "",
};

export function GradientText({
  children,
  className,
  gradient = "primary",
  customGradient,
  animated = false,
}: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradient === "custom" ? customGradient : gradients[gradient],
        animated && "animate-gradient bg-[length:200%_auto]",
        className,
      )}
    >
      {children}
    </span>
  );
}
