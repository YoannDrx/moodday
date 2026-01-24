"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

type BreathingWidgetProps = {
  /** Inhale duration in seconds */
  inhaleDuration?: number;
  /** Hold duration in seconds */
  holdDuration?: number;
  /** Exhale duration in seconds */
  exhaleDuration?: number;
  /** Rest duration in seconds */
  restDuration?: number;
  className?: string;
};

const phaseLabels: Record<BreathingPhase, { fr: string; en: string }> = {
  inhale: { fr: "Inspirez", en: "Inhale" },
  hold: { fr: "Retenez", en: "Hold" },
  exhale: { fr: "Expirez", en: "Exhale" },
  rest: { fr: "Pause", en: "Rest" },
};

const phaseColors: Record<BreathingPhase, string> = {
  inhale: "from-[var(--primary)] to-[var(--primary-light)]",
  hold: "from-[var(--lavender)] to-[var(--lavender-dark)]",
  exhale: "from-[var(--sage)] to-[var(--sage-dark)]",
  rest: "from-gray-300 to-gray-400",
};

/**
 * BreathingWidget - Guided breathing exercise for crisis support
 *
 * Based on 4-7-8 breathing technique:
 * - Inhale for 4 seconds
 * - Hold for 7 seconds
 * - Exhale for 8 seconds
 *
 * The circle expands on inhale and contracts on exhale.
 *
 * @example
 * ```tsx
 * <BreathingWidget />
 * ```
 */
export function BreathingWidget({
  inhaleDuration = 4,
  holdDuration = 7,
  exhaleDuration = 8,
  restDuration = 2,
  className,
}: BreathingWidgetProps) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>("rest");
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);

  const getDuration = useCallback(
    (p: BreathingPhase) => {
      switch (p) {
        case "inhale":
          return inhaleDuration;
        case "hold":
          return holdDuration;
        case "exhale":
          return exhaleDuration;
        case "rest":
          return restDuration;
      }
    },
    [inhaleDuration, holdDuration, exhaleDuration, restDuration],
  );

  const getNextPhase = (currentPhase: BreathingPhase): BreathingPhase => {
    switch (currentPhase) {
      case "rest":
        return "inhale";
      case "inhale":
        return "hold";
      case "hold":
        return "exhale";
      case "exhale":
        return "rest";
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(phase);
          setPhase(nextPhase);

          if (nextPhase === "inhale" && phase === "rest") {
            setCycleCount((c) => c + 1);
          }

          return getDuration(nextPhase);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase, getDuration]);

  const handleStart = () => {
    setIsActive(true);
    setPhase("inhale");
    setTimeLeft(inhaleDuration);
    setCycleCount(1);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase("rest");
    setTimeLeft(0);
    setCycleCount(0);
  };

  const getCircleScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case "inhale":
        return 1.3;
      case "hold":
        return 1.3;
      case "exhale":
        return 0.8;
      case "rest":
        return 1;
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      {/* Breathing Circle */}
      <div className="relative flex size-64 items-center justify-center">
        {/* Outer glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-all duration-1000",
            phaseColors[phase],
          )}
          style={{
            transform: `scale(${getCircleScale()})`,
          }}
        />

        {/* Main circle */}
        <div
          className={cn(
            "flex size-48 items-center justify-center rounded-full bg-gradient-to-br shadow-lg transition-all",
            phaseColors[phase],
          )}
          style={{
            transform: `scale(${getCircleScale()})`,
            transitionDuration: isActive ? `${getDuration(phase)}s` : "0.3s",
            transitionTimingFunction:
              phase === "inhale" || phase === "exhale"
                ? "ease-in-out"
                : "linear",
          }}
        >
          <div className="text-center text-white">
            {isActive ? (
              <>
                <p className="text-2xl font-bold">{timeLeft}</p>
                <p className="text-sm font-medium opacity-90">
                  {phaseLabels[phase].fr}
                </p>
              </>
            ) : (
              <p className="text-lg font-medium">Prêt ?</p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isActive ? (
          <Button
            onClick={handleStart}
            className="gap-2 rounded-2xl bg-[var(--primary)] px-8 py-3 text-white hover:bg-[var(--primary-dark)]"
          >
            <Play className="size-5" />
            Commencer
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            variant="outline"
            className="gap-2 rounded-2xl px-8 py-3"
          >
            <Pause className="size-5" />
            Pause
          </Button>
        )}

        {cycleCount > 0 && (
          <Button
            onClick={handleReset}
            variant="ghost"
            className="gap-2 rounded-2xl"
          >
            <RotateCcw className="size-5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Cycle counter */}
      {cycleCount > 0 && (
        <p className="text-muted-foreground text-sm">
          Cycle {cycleCount} • Technique 4-7-8
        </p>
      )}

      {/* Instructions */}
      {!isActive && cycleCount === 0 && (
        <div className="text-muted-foreground max-w-sm text-center text-sm">
          <p className="mb-2 font-medium">Technique de respiration 4-7-8</p>
          <p>
            Inspirez pendant 4 secondes, retenez pendant 7 secondes, expirez
            pendant 8 secondes. Cette technique aide à calmer le système
            nerveux.
          </p>
        </div>
      )}
    </div>
  );
}
