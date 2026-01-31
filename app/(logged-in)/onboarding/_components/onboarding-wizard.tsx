"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  Heart,
  Pill,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeOnboarding,
  updateOnboardingProgress,
  updateNotificationPreferences,
} from "@/features/preferences/preferences.action";
import { saveMoodEntry } from "@/features/mood/mood.action";
import { createMedication } from "@/features/medication/medication.action";
import { inviteCaregiver } from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

const emailSchema = z.string().email();

type OnboardingStep = {
  key: "welcome" | "mood" | "medications" | "preferences" | "ready";
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  optional?: boolean;
};

export function OnboardingWizard() {
  const { t } = useI18n();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Mood step state
  const [moodValue, setMoodValue] = useState(6);
  const [anxietyValue, setAnxietyValue] = useState(4);
  const [moodNote, setMoodNote] = useState("");

  // Medication step state
  const [medicationName, setMedicationName] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState<
    "daily" | "twice_daily" | "weekly" | "prn"
  >("daily");

  // Preferences + caregiver state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyCheckInReminder, setDailyCheckInReminder] = useState(true);
  const [dailyCheckInTime, setDailyCheckInTime] = useState("09:00");
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [medicationReminderTime, setMedicationReminderTime] =
    useState("09:00");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "family" | "friend" | "professional"
  >("family");
  const [inviteLabel, setInviteLabel] = useState("");

  const steps: OnboardingStep[] = useMemo(
    () => [
      {
        key: "welcome",
        icon: <Heart className="size-12 text-pink-500" />,
        titleKey: "onboarding.steps.welcome.title",
        descriptionKey: "onboarding.steps.welcome.description",
      },
      {
        key: "mood",
        icon: <TrendingUp className="size-12 text-blue-500" />,
        titleKey: "onboarding.steps.mood.title",
        descriptionKey: "onboarding.steps.mood.description",
      },
      {
        key: "medications",
        icon: <Pill className="size-12 text-purple-500" />,
        titleKey: "onboarding.steps.medications.title",
        descriptionKey: "onboarding.steps.medications.description",
        optional: true,
      },
      {
        key: "preferences",
        icon: <Bell className="size-12 text-amber-500" />,
        titleKey: "onboarding.steps.preferences.title",
        descriptionKey: "onboarding.steps.preferences.description",
        optional: true,
      },
      {
        key: "ready",
        icon: <Sparkles className="size-12 text-emerald-500" />,
        titleKey: "onboarding.steps.ready.title",
        descriptionKey: "onboarding.steps.ready.description",
      },
    ],
    [],
  );

  const updateProgressMutation = useMutation({
    mutationFn: async (step: number) => {
      const result = await updateOnboardingProgress({ step });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const moodMutation = useMutation({
    mutationFn: async () => {
      const result = await saveMoodEntry({
        value: moodValue,
        note: moodNote.trim() || undefined,
        anxiety: anxietyValue,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const medicationMutation = useMutation({
    mutationFn: async () => {
      const result = await createMedication({
        name: medicationName.trim(),
        dosage: medicationDosage.trim(),
        frequency: medicationFrequency,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: async () => {
      const result = await updateNotificationPreferences({
        notificationsEnabled,
        dailyCheckInReminder,
        dailyCheckInTime,
        medicationReminders,
        medicationReminderTime,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await inviteCaregiver({
        email: inviteEmail.trim(),
        role: inviteRole,
        label: inviteLabel.trim() || undefined,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const result = await completeOnboarding();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("onboarding.complete"));
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isLastStep = currentStep === steps.length - 1;
  const current = steps[currentStep];

  const isBusy =
    moodMutation.isPending ||
    medicationMutation.isPending ||
    preferencesMutation.isPending ||
    inviteMutation.isPending ||
    completeMutation.isPending;

  const moveToStep = (nextStep: number) => {
    setCurrentStep(nextStep);
    updateProgressMutation.mutate(nextStep);
  };

  const handleNext = async () => {
    try {
      if (current.key === "mood") {
        await moodMutation.mutateAsync();
      }

      if (current.key === "medications") {
        if (medicationName.trim() || medicationDosage.trim()) {
          if (!medicationName.trim() || !medicationDosage.trim()) {
            toast.error(t("onboarding.errors.missingMedicationInfo"));
            return;
          }
          await medicationMutation.mutateAsync();
        }
      }

      if (current.key === "preferences") {
        await preferencesMutation.mutateAsync();

        if (inviteEmail.trim().length > 0) {
          const validation = emailSchema.safeParse(inviteEmail.trim());
          if (!validation.success) {
            toast.error(t("onboarding.errors.invalidInviteEmail"));
            return;
          }
          await inviteMutation.mutateAsync();
        }
      }

      if (isLastStep) {
        completeMutation.mutate();
        return;
      }

      moveToStep(currentStep + 1);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("common.unexpectedError"),
      );
    }
  };

  const handleSkip = () => {
    if (isLastStep) return;
    moveToStep(currentStep + 1);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Card className="w-full max-w-xl">
        <CardContent className="pt-8 pb-6">
          {/* Progress dots */}
          <div className="mb-8 flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">{current.icon}</div>
            <h2 className="mb-2 text-2xl font-bold">{t(current.titleKey)}</h2>
            <p className="text-muted-foreground mb-6">
              {t(current.descriptionKey)}
            </p>
          </div>

          {current.key === "mood" && (
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>{t("onboarding.mood.label")}</Label>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {moodValue}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodValue}
                  onChange={(e) => setMoodValue(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-[var(--primary)]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>{t("onboarding.mood.anxietyLabel")}</Label>
                  <span className="text-lg font-bold text-red-500">
                    {anxietyValue}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyValue}
                  onChange={(e) => setAnxietyValue(Number(e.target.value))}
                  className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gray-100 accent-red-500"
                />
              </div>

              <div>
                <Label>{t("onboarding.mood.noteLabel")}</Label>
                <Textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder={t("onboarding.mood.notePlaceholder")}
                  className="mt-2 min-h-[90px]"
                />
              </div>
            </div>
          )}

          {current.key === "medications" && (
            <div className="space-y-5">
              <div>
                <Label>{t("onboarding.medication.nameLabel")}</Label>
                <Input
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder={t("onboarding.medication.namePlaceholder")}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("onboarding.medication.dosageLabel")}</Label>
                <Input
                  value={medicationDosage}
                  onChange={(e) => setMedicationDosage(e.target.value)}
                  placeholder={t("onboarding.medication.dosagePlaceholder")}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t("onboarding.medication.frequencyLabel")}</Label>
                <Select
                  value={medicationFrequency}
                  onValueChange={(value) =>
                    setMedicationFrequency(
                      value as "daily" | "twice_daily" | "weekly" | "prn",
                    )
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">
                      {t("medication.frequency.daily")}
                    </SelectItem>
                    <SelectItem value="twice_daily">
                      {t("medication.frequency.twiceDaily")}
                    </SelectItem>
                    <SelectItem value="weekly">
                      {t("medication.frequency.weekly")}
                    </SelectItem>
                    <SelectItem value="prn">
                      {t("medication.frequency.prn")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("onboarding.medication.laterHint")}
              </p>
            </div>
          )}

          {current.key === "preferences" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {t("settings.notifications.title")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("settings.notifications.enabledHint")}
                    </p>
                  </div>
                  <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {t("settings.notifications.dailyCheckIn")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("settings.notifications.dailyCheckInHint")}
                    </p>
                  </div>
                  <Switch
                    checked={dailyCheckInReminder}
                    onCheckedChange={setDailyCheckInReminder}
                  />
                </div>
                {dailyCheckInReminder && (
                  <div className="mt-3">
                    <Label>{t("settings.notifications.checkInTime")}</Label>
                    <Input
                      type="time"
                      value={dailyCheckInTime}
                      onChange={(e) => setDailyCheckInTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {t("settings.notifications.medicationReminders")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("settings.notifications.medicationRemindersHint")}
                    </p>
                  </div>
                  <Switch
                    checked={medicationReminders}
                    onCheckedChange={setMedicationReminders}
                  />
                </div>
                {medicationReminders && (
                  <div className="mt-3">
                    <Label>
                      {t("settings.notifications.medicationReminderTime")}
                    </Label>
                    <Input
                      type="time"
                      value={medicationReminderTime}
                      onChange={(e) =>
                        setMedicationReminderTime(e.target.value)
                      }
                      className="mt-2"
                    />
                    <p className="text-muted-foreground mt-2 text-sm">
                      {t(
                        "settings.notifications.medicationReminderTimeHint",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
                <p className="font-semibold">
                  {t("onboarding.preferences.invite.title")}
                </p>
                <p className="text-muted-foreground text-sm">
                  {t("onboarding.preferences.invite.description")}
                </p>
                <div className="mt-4 grid gap-3">
                  <Input
                    placeholder={t(
                      "onboarding.preferences.invite.emailPlaceholder",
                    )}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(value) =>
                      setInviteRole(value as "family" | "friend" | "professional")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">
                        {t("caregiver.roles.family")}
                      </SelectItem>
                      <SelectItem value="friend">
                        {t("caregiver.roles.friend")}
                      </SelectItem>
                      <SelectItem value="professional">
                        {t("caregiver.roles.professional")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={t(
                      "onboarding.preferences.invite.labelPlaceholder",
                    )}
                    value={inviteLabel}
                    onChange={(e) => setInviteLabel(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={handleNext}
              disabled={isBusy}
              className="w-full"
            >
              {isLastStep ? t("onboarding.start") : t("onboarding.next")}
              <ChevronRight className="ml-2 size-4" />
            </Button>
            {current.optional && !isLastStep && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isBusy}
                className="w-full"
              >
                {t("onboarding.skip")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
