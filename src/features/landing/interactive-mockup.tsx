"use client";

import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Moon,
  Pill,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

type FeatureKey = "mood" | "meds" | "insights" | "reminders";

export function InteractiveMockup() {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("mood");
  const { t } = useI18n();

  const features: Record<
    FeatureKey,
    {
      icon: React.ReactNode;
      label: string;
      description: string;
    }
  > = {
    mood: {
      icon: <TrendingUp className="size-5" />,
      label: t("landing2.mockup.tabs.mood"),
      description: t("landing2.features.items.moodTracking.description"),
    },
    meds: {
      icon: <Pill className="size-5" />,
      label: t("landing2.mockup.tabs.meds"),
      description: t("landing2.features.items.medications.description"),
    },
    insights: {
      icon: <Calendar className="size-5" />,
      label: t("landing2.mockup.tabs.insights"),
      description: t("landing2.features.items.aiInsights.description"),
    },
    reminders: {
      icon: <Bell className="size-5" />,
      label: t("landing2.mockup.tabs.reminders"),
      description: t("landing2.features.items.medications.description"),
    },
  };

  return (
    <div className="relative">
      {/* Glow effect behind mockup */}
      <div className="animate-pulse-glow from-primary/20 absolute inset-0 rounded-3xl bg-gradient-to-r to-emerald-500/20 blur-xl" />

      {/* Main mockup container */}
      <div className="border-border bg-card relative rounded-2xl border p-1 shadow-2xl">
        {/* Browser chrome */}
        <div className="border-border flex items-center gap-2 border-b px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
          </div>
          <div className="bg-muted/50 text-muted-foreground ml-4 flex-1 rounded-md px-3 py-1.5 text-center text-xs">
            moodday.app/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-foreground text-lg font-semibold">
                {t("landing2.mockup.greeting")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("landing2.mockup.date")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="from-primary flex size-8 items-center justify-center rounded-full bg-gradient-to-br to-emerald-500">
                <span className="text-sm font-bold text-white">M</span>
              </div>
            </div>
          </div>

          {/* Feature tabs */}
          <div className="mb-4 flex gap-2">
            {(Object.keys(features) as FeatureKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveFeature(key)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  activeFeature === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {features[key].icon}
                <span className="hidden sm:inline">{features[key].label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic content based on active feature */}
          <div className="bg-muted/50 min-h-[280px] rounded-xl p-4">
            {activeFeature === "mood" && <MoodContent />}
            {activeFeature === "meds" && <MedsContent />}
            {activeFeature === "insights" && <InsightsContent />}
            {activeFeature === "reminders" && <RemindersContent />}
          </div>

          {/* Bottom feature hint */}
          <div className="bg-primary/10 mt-4 flex items-center justify-between rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary size-2 animate-pulse rounded-full" />
              <span className="text-primary text-sm">
                {features[activeFeature].description}
              </span>
            </div>
            <ChevronRight className="text-primary size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MoodContent() {
  const { t } = useI18n();
  // Data points: sinusoidal curve that trends upward
  const moodData = [42, 55, 48, 62, 58, 72, 75];
  const days = [
    t("landing2.mockup.moodPanel.days.mon"),
    t("landing2.mockup.moodPanel.days.tue"),
    t("landing2.mockup.moodPanel.days.wed"),
    t("landing2.mockup.moodPanel.days.thu"),
    t("landing2.mockup.moodPanel.days.fri"),
    t("landing2.mockup.moodPanel.days.sat"),
    t("landing2.mockup.moodPanel.days.sun"),
  ];
  const weeklyDelta = t("landing2.mockup.moodPanel.weeklyDelta", {
    percent: 8,
  });
  const lastUpdatedTime = t("landing2.mockup.moodPanel.lastUpdatedTime");

  // SVG chart dimensions
  const width = 320;
  const height = 110;
  const padding = { top: 15, bottom: 22, left: 18, right: 18 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const points = moodData.map((value, idx) => ({
    x: padding.left + (idx / (moodData.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (value / 100) * chartHeight,
  }));

  // Create smooth curve path using cubic bezier
  const createSmoothPath = () => {
    if (points.length < 2) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    return path;
  };

  // Create area path (curve + bottom fill)
  const createAreaPath = () => {
    const curvePath = createSmoothPath();
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    return `${curvePath} L ${lastPoint.x} ${height - padding.bottom} L ${firstPoint.x} ${height - padding.bottom} Z`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("landing2.mockup.moodPanel.average")}
        </span>
        <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          {weeklyDelta}
        </span>
      </div>

      {/* SVG Line Chart */}
      <div className="-mx-4">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-36 w-full"
          preserveAspectRatio="none"
        >
          {/* Filled area under curve */}
          <path
            d={createAreaPath()}
            className="fill-primary/15 transition-all duration-500"
          />

          {/* Main curve line */}
          <path
            d={createSmoothPath()}
            fill="none"
            className="stroke-primary transition-all duration-500"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, idx) => (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="4"
              className="fill-primary transition-all duration-300"
            />
          ))}

          {/* Day labels */}
          {points.map((point, idx) => (
            <text
              key={`label-${idx}`}
              x={point.x}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {days[idx]}
            </text>
          ))}
        </svg>
      </div>

      {/* Current mood */}
      <div className="bg-muted flex items-center justify-between rounded-lg p-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">😊</span>
          <div>
            <p className="text-foreground text-sm font-medium">
              {t("landing2.mockup.moodPanel.title")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("landing2.mockup.moodPanel.lastUpdated", {
                time: lastUpdatedTime,
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-primary text-xl font-bold">7.5</p>
          <p className="text-muted-foreground text-xs">/10</p>
        </div>
      </div>
    </div>
  );
}

function MedsContent() {
  const { t } = useI18n();
  const meds = [
    {
      name: t("landing2.mockup.medsPanel.samples.lithium"),
      time: "08:00",
      taken: true,
    },
    {
      name: t("landing2.mockup.medsPanel.samples.lamotrigine"),
      time: "12:00",
      taken: true,
    },
    {
      name: t("landing2.mockup.medsPanel.samples.quetiapine"),
      time: "20:00",
      taken: false,
    },
  ];
  const takenCount = meds.filter((med) => med.taken).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("landing2.mockup.medsPanel.title")}
        </span>
        <span className="bg-primary/20 text-primary rounded-full px-2 py-1 text-xs font-medium">
          {t("landing2.mockup.medsPanel.progress", {
            taken: takenCount,
            total: meds.length,
          })}
        </span>
      </div>

      <div className="space-y-2">
        {meds.map((med, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-center justify-between rounded-lg p-3 transition-all",
              med.taken ? "bg-emerald-500/10" : "bg-muted",
            )}
          >
            <div className="flex items-center gap-3">
              {med.taken ? (
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="border-muted-foreground size-5 rounded-full border-2" />
              )}
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    med.taken
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground",
                  )}
                >
                  {med.name}
                </p>
                <p className="text-muted-foreground text-xs">{med.time}</p>
              </div>
            </div>
            {!med.taken && (
              <button className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium">
                {t("landing2.mockup.medsPanel.confirm")}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {t("landing2.mockup.medsPanel.monthlyAdherence")}
          </span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            98%
          </span>
        </div>
        <div className="bg-muted-foreground/20 mt-2 h-2 w-full overflow-hidden rounded-full">
          <div className="from-primary h-full w-[98%] rounded-full bg-gradient-to-r to-emerald-500" />
        </div>
      </div>
    </div>
  );
}

function InsightsContent() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("landing2.mockup.insightsPanel.title")}
        </span>
        <span className="text-muted-foreground text-xs">
          {t("landing2.mockup.insightsPanel.updatedAgo", { hours: 2 })}
        </span>
      </div>

      <div className="space-y-3">
        {[
          {
            icon: <Moon className="size-4 text-purple-500" />,
            title: t("landing2.mockup.insightsPanel.sleepCorrelation"),
            desc: t("landing2.mockup.insightsPanel.sleepDesc"),
            color: "bg-purple-500/10",
          },
          {
            icon: (
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
            ),
            title: t("landing2.mockup.insightsPanel.weekendPattern"),
            desc: t("landing2.mockup.insightsPanel.weekendDesc"),
            color: "bg-emerald-500/10",
          },
          {
            icon: <Calendar className="text-primary size-4" />,
            title: t("landing2.mockup.insightsPanel.medicationEffect"),
            desc: t("landing2.mockup.insightsPanel.medicationDesc"),
            color: "bg-primary/10",
          },
        ].map((insight, idx) => (
          <div key={idx} className={cn("rounded-lg p-3", insight.color)}>
            <div className="mb-1 flex items-center gap-2">
              {insight.icon}
              <span className="text-foreground text-sm font-medium">
                {insight.title}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">{insight.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RemindersContent() {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {t("landing2.mockup.remindersPanel.title")}
        </span>
        <button className="text-primary text-xs hover:underline">
          {t("landing2.mockup.remindersPanel.configure")}
        </button>
      </div>

      <div className="space-y-2">
        {[
          {
            time: "20:00",
            label: t("landing2.mockup.remindersPanel.samples.quetiapine"),
            type: "med",
          },
          {
            time: "21:00",
            label: t("landing2.mockup.remindersPanel.moodCheckin"),
            type: "mood",
          },
          {
            time: "22:30",
            label: t("landing2.mockup.remindersPanel.samples.sleepReminder"),
            type: "sleep",
          },
        ].map((reminder, idx) => (
          <div
            key={idx}
            className="bg-muted flex items-center justify-between rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 flex size-10 items-center justify-center rounded-lg">
                {reminder.type === "med" && (
                  <Pill className="text-primary size-5" />
                )}
                {reminder.type === "mood" && (
                  <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                )}
                {reminder.type === "sleep" && (
                  <Moon className="size-5 text-purple-500" />
                )}
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">
                  {reminder.label}
                </p>
                <p className="text-muted-foreground text-xs">
                  {t("landing2.mockup.remindersPanel.daily")}
                </p>
              </div>
            </div>
            <span className="text-primary font-mono text-sm">
              {reminder.time}
            </span>
          </div>
        ))}
      </div>

      <div className="border-border rounded-lg border border-dashed p-3 text-center">
        <p className="text-muted-foreground text-sm">
          + {t("landing2.mockup.remindersPanel.addReminder")}
        </p>
      </div>
    </div>
  );
}
