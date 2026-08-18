"use client";

import { useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { MoodChart as MoodChartType, MoodChartProps } from "./mood-chart";

type MoodChartComponent = typeof MoodChartType;

export function LazyMoodChart(props: MoodChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [Chart, setChart] = useState<MoodChartComponent | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || Chart) return;

    const loadChart = () => {
      void import("./mood-chart").then((module) => {
        setChart(() => module.MoodChart);
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      loadChart();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadChart();
      },
      { rootMargin: "0px" },
    );
    observer.observe(container);

    return () => observer.disconnect();
  }, [Chart]);

  return (
    <div ref={containerRef}>
      {Chart ? <Chart {...props} /> : <Skeleton className="h-48 w-full" />}
    </div>
  );
}
