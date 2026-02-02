"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  eventTypes,
  eventTypeLabels,
  eventTypeColors,
} from "@/lib/design-tokens";
import { createEvent } from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const getEventSchema = (t: Translator) =>
  z.object({
    eventType: z.string().min(1, t("caregiver.event.validation.typeRequired")),
    severity: z.number().min(1).max(5),
    description: z
      .string()
      .min(10, t("caregiver.event.validation.descriptionMin")),
    eventDate: z.date(),
    visibleToPatient: z.boolean(),
  });

type EventFormValues = z.infer<ReturnType<typeof getEventSchema>>;

type CaregiverEventFormProps = {
  subjectId: string;
  subjectName: string;
  onSuccess?: () => void;
  className?: string;
};

const severityLabelKeys: Record<number, string> = {
  1: "caregiver.event.severityLabels.minor",
  2: "caregiver.event.severityLabels.low",
  3: "caregiver.event.severityLabels.moderate",
  4: "caregiver.event.severityLabels.high",
  5: "caregiver.event.severityLabels.critical",
};

const severityColors: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#fbbf24",
  4: "#f97316",
  5: "#ef4444",
};

export function CaregiverEventForm({
  subjectId,
  subjectName,
  onSuccess,
  className,
}: CaregiverEventFormProps) {
  const { locale, t } = useI18n();
  const dateLocale = locale === "fr" ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(getEventSchema(t)),
    defaultValues: {
      severity: 3,
      eventDate: new Date(),
      visibleToPatient: true,
    },
  });

  const selectedSeverity = form.watch("severity");
  const severityLabelKey = severityLabelKeys[selectedSeverity];
  const severityColor = severityColors[selectedSeverity];

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createEvent({
        subjectId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        eventDate: data.eventDate.toISOString(),
        visibleToPatient: data.visibleToPatient,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("caregiver.event.saved"));
      form.reset();
      onSuccess?.();
    } catch {
      toast.error(t("caregiver.event.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className="text-muted-foreground mb-4 text-sm">
        {t("caregiver.event.for", { name: subjectName })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("caregiver.event.typeLabel")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: eventTypeColors[type] }}
                        />
                        {t(eventTypeLabels[type])}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t("caregiver.event.dateLabel")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                    >
                      {format(field.value, "PPP", { locale: dateLocale })}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="severity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t("caregiver.event.severityLabel")}{" "}
              <span className="font-semibold" style={{ color: severityColor }}>
                {severityLabelKey ? t(severityLabelKey) : ""}
              </span>
            </FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
                className="py-4"
              />
            </FormControl>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{t("caregiver.event.severityScaleMin")}</span>
              <span>{t("caregiver.event.severityScaleMax")}</span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("caregiver.event.descriptionLabel")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("caregiver.event.descriptionPlaceholder")}
                className="min-h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="visibleToPatient"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t("caregiver.event.visibleLabel")}
              </FormLabel>
              <FormDescription>
                {t("caregiver.event.visibleDescription")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("common.saving") : t("caregiver.event.submit")}
      </Button>
    </Form>
  );
}
