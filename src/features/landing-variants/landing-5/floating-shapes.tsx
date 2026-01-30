"use client";

import { useEffect, useState } from "react";

export function FloatingShapes() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large sphere - top right */}
      <div
        className="animate-float absolute -top-20 -right-20 size-80 rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(43, 160, 159, 0.3), rgba(43, 160, 159, 0.1), transparent 70%)",
          animationDuration: "8s",
        }}
      />

      {/* Medium sphere - left */}
      <div
        className="animate-float-delayed absolute top-1/3 -left-16 size-48 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(72, 168, 120, 0.3), rgba(72, 168, 120, 0.1), transparent 70%)",
          animationDuration: "10s",
        }}
      />

      {/* Small sphere - bottom right */}
      <div
        className="animate-float-slow absolute right-1/4 bottom-20 size-32 rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(212, 197, 232, 0.5), rgba(212, 197, 232, 0.2), transparent 70%)",
          animationDuration: "12s",
        }}
      />

      {/* Torus/ring - center left */}
      <div
        className="animate-spin-slow absolute top-1/2 left-1/4 size-64 -translate-y-1/2 opacity-30"
        style={{ animationDuration: "30s" }}
      >
        <div
          className="size-full rounded-full border-[12px] border-[#2BA09F]/30"
          style={{ transform: "rotateX(60deg)" }}
        />
      </div>

      {/* Small floating dots */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="animate-float absolute size-3 rounded-full bg-[#2BA09F]/20"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}
