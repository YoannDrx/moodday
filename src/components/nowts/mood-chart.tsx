"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useI18n } from "@/i18n/provider";

type MoodEntry = {
  id: string;
  value: number;
  note: string | null;
  date: string;
};

type DosageChange = {
  id: string;
  medicationName: string;
  previousDosage: string | null;
  newDosage: string;
  date: string;
};

export type MoodChartProps = {
  moodEntries: MoodEntry[];
  dosageChanges?: DosageChange[];
  showDosageMarkers?: boolean;
  height?: number;
  compact?: boolean;
};

export function MoodChart({
  moodEntries,
  dosageChanges = [],
  showDosageMarkers = true,
  height = 300,
  compact = false,
}: MoodChartProps) {
  const { t } = useI18n();

  const chartData = useMemo(() => {
    // Group entries by date and average if multiple per day
    const byDate = new Map<
      string,
      { sum: number; count: number; notes: string[] }
    >();

    for (const entry of moodEntries) {
      const dateKey = new Date(entry.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      });

      const existing = byDate.get(dateKey);
      if (existing) {
        existing.sum += entry.value;
        existing.count += 1;
        if (entry.note) existing.notes.push(entry.note);
      } else {
        byDate.set(dateKey, {
          sum: entry.value,
          count: 1,
          notes: entry.note ? [entry.note] : [],
        });
      }
    }

    return Array.from(byDate.entries()).map(([date, data]) => ({
      date,
      value: Math.round((data.sum / data.count) * 10) / 10,
      notes: data.notes,
    }));
  }, [moodEntries]);

  const dosageMarkers = useMemo(() => {
    if (!showDosageMarkers) return [];

    return dosageChanges.map((change) => ({
      date: new Date(change.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
      }),
      label: `${change.medicationName}: ${change.previousDosage ?? "?"} → ${change.newDosage}`,
    }));
  }, [dosageChanges, showDosageMarkers]);

  if (moodEntries.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center"
        style={{ height }}
      >
        <p>{t("insights.chart.noData")}</p>
      </div>
    );
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: { value: number; payload: { notes: string[] } }[];
    label?: string;
  }) => {
    if (active && payload?.length) {
      const entry = payload[0];
      const dosageMarker = dosageMarkers.find((m) => m.date === label);

      return (
        <div className="bg-background/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
          <p className="font-medium">{label}</p>
          <p className="text-primary">
            {t("insights.chart.mood")}: {entry.value}/10
          </p>
          {entry.payload.notes.length > 0 && (
            <p className="text-muted-foreground mt-1 line-clamp-2 max-w-[200px] text-sm">
              {entry.payload.notes[0]}
            </p>
          )}
          {dosageMarker && (
            <p className="mt-1 text-sm text-orange-500">{dosageMarker.label}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={
          compact
            ? { top: 5, right: 5, left: -20, bottom: 5 }
            : { top: 20, right: 30, left: 0, bottom: 20 }
        }
      >
        {!compact && (
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        )}
        <XAxis
          dataKey="date"
          tick={compact ? false : { fontSize: 12 }}
          tickLine={!compact}
          axisLine={!compact}
          className="text-muted-foreground"
        />
        <YAxis
          domain={[0, 10]}
          tick={compact ? false : { fontSize: 12 }}
          tickLine={!compact}
          axisLine={!compact}
          className="text-muted-foreground"
        />
        {!compact && <Tooltip content={<CustomTooltip />} />}

        {/* Dosage change markers */}
        {showDosageMarkers &&
          dosageMarkers.map((marker) => (
            <ReferenceLine
              key={marker.date}
              x={marker.date}
              stroke="var(--chart-4)"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          ))}

        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={
            compact
              ? false
              : {
                  fill: "var(--primary)",
                  strokeWidth: 2,
                  r: 4,
                }
          }
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
