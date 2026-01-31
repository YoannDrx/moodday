"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, AlertTriangle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr } from "date-fns/locale";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/nowts/layout-components";
import {
  moodObservedLabels,
  energyObservedLabels,
  moodObservedColors,
  eventTypeLabels,
  eventTypeColors,
  type MoodObserved,
  type EventType,
} from "@/lib/design-tokens";
import { getCaregiverActivity } from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

type CaregiverActivityListProps = {
  className?: string;
};

export function CaregiverActivityList({
  className,
}: CaregiverActivityListProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === "fr" ? fr : enUS;

  const { data: activity, isLoading } = useQuery({
    queryKey: ["caregiver-activity"],
    queryFn: async () => {
      const result = await getCaregiverActivity({ days: 30, limit: 20 });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title={t("caregiver.activity.emptyTitle")}
        description={t("caregiver.activity.emptyDescription")}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activity.map((item) => {
        const timeAgo = formatDistanceToNow(new Date(item.createdAt), {
          addSuffix: true,
          locale: dateLocale,
        });

        if (item.type === "observation") {
          const moodColor = item.moodObserved
            ? moodObservedColors[item.moodObserved as MoodObserved]
            : undefined;
          const moodLabel = item.moodObserved
            ? t(moodObservedLabels[item.moodObserved as MoodObserved])
            : undefined;
          const energyLabel = item.energyObserved
            ? t(
                energyObservedLabels[
                  item.energyObserved as "high" | "normal" | "low" | "very_low"
                ],
              )
            : undefined;

          return (
            <Card key={item.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-4">
                <Avatar className="size-10">
                  <AvatarImage src={item.subjectImage ?? undefined} />
                  <AvatarFallback>
                    {item.subjectName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="text-muted-foreground size-4" />
                    <span className="font-medium">{item.subjectName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {t("caregiver.activity.badgeObservation")}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {moodLabel && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: moodColor,
                          color: moodColor,
                        }}
                      >
                        {t("caregiver.activity.moodLabel", {
                          value: moodLabel,
                        })}
                      </Badge>
                    )}
                    {energyLabel && (
                      <Badge variant="outline">
                        {t("caregiver.activity.energyLabel", {
                          value: energyLabel,
                        })}
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                      {item.notes}
                    </p>
                  )}
                  <p className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <Clock className="size-3" />
                    {timeAgo}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        }

        // Event type
        const eventColor = eventTypeColors[item.eventType as EventType];
        const eventLabel = t(eventTypeLabels[item.eventType as EventType]);

        return (
          <Card key={item.id} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-4 p-4">
              <Avatar className="size-10">
                <AvatarImage src={item.subjectImage ?? undefined} />
                <AvatarFallback>
                  {item.subjectName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="size-4"
                    style={{ color: eventColor }}
                  />
                  <span className="font-medium">{item.subjectName}</span>
                  <Badge
                    style={{
                      backgroundColor: `${eventColor}20`,
                      color: eventColor,
                      borderColor: eventColor,
                    }}
                  >
                    {eventLabel}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                  {item.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {timeAgo}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      item.severity >= 4
                        ? "border-red-500 text-red-500"
                        : item.severity >= 3
                          ? "border-yellow-500 text-yellow-500"
                          : ""
                    }
                  >
                    {t("caregiver.activity.severityLabel", {
                      value: item.severity,
                    })}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
