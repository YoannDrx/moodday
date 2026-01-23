"use client";

import { cn } from "@/lib/utils";
import { motion, type MotionProps } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

type MotionWrapperProps = {
  children: ReactNode;
  className?: string;
  /** Animation variant - determines the animation type */
  animation?:
    | "fadeUp"
    | "fadeDown"
    | "fadeIn"
    | "fadeLeft"
    | "fadeRight"
    | "scale";
  /** Delay before animation starts (in seconds) */
  delay?: number;
  /** Duration of animation (in seconds) */
  duration?: number;
  /** Whether to trigger animation when element enters viewport */
  inView?: boolean;
  /** Only animate once when entering viewport */
  once?: boolean;
} & Omit<
  MotionProps,
  "initial" | "animate" | "whileInView" | "viewport" | "transition"
>;

const animations = {
  fadeUp: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  fadeDown: { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  fadeLeft: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
  fadeRight: { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
};

/**
 * Motion wrapper that handles SSR hydration correctly.
 * Prevents flash of invisible content by only applying animations after hydration.
 */
export function MotionWrapper({
  children,
  className,
  animation = "fadeUp",
  delay = 0,
  duration = 0.6,
  inView = true,
  once = true,
  ...props
}: MotionWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const variants = animations[animation];

  // Before hydration, render without motion to avoid SSR mismatch
  if (!isHydrated) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      {...(inView
        ? { whileInView: "visible", viewport: { once } }
        : { animate: "visible" })}
      variants={variants}
      transition={{ duration, delay, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
