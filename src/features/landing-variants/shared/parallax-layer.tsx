"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type ParallaxLayerProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number; // 0 = no parallax, 1 = same as scroll, negative = opposite
  direction?: "vertical" | "horizontal";
};

export function ParallaxLayer({
  children,
  className,
  speed = 0.5,
  direction = "vertical",
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;

      // Calculate how far the element is from the center of the viewport
      const centerOffset = elementTop - windowHeight / 2;
      setOffset(centerOffset * speed * -1);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  const transform =
    direction === "vertical"
      ? `translateY(${offset}px)`
      : `translateX(${offset}px)`;

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        transform,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
