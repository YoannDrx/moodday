"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Eye,
  AlertTriangle,
  Clock,
  Plus,
  ChevronRight,
  UserPlus,
  Activity,
  Shield,
  Trash2,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { toast } from "sonner";

import { BrandIllustration } from "@/components/brand/brand-illustration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { cn } from "@/lib/utils";
import {
  moodObservedLabels,
  energyObservedLabels,
  moodObservedColors,
  eventTypeLabels,
  eventTypeColors,
  type MoodObserved,
  type EventType,
} from "@/lib/design-tokens";
import {
  getCaregiverAccessLog,
  getCaregiverActivity,
  getCaregiverDigestPreferences,
  getCaregiverSummary,
  getMyCaregivers,
  getMyPatients,
  inviteCaregiver,
  removeCaregiverRelationship,
  updateCaregiverPermissions,
  updateCaregiverDigestPreferences,
} from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";
import {
  caregiverPermissionValues,
  type CaregiverPermission,
} from "@/features/caregiver/permissions";

type CaregiverSummary = {
  observationsThisWeek: number;
  observationsThisMonth: number;
  eventsThisMonth: number;
  concerningEvents: number;
};

type AccessWindowDays = 7 | 30 | 90;

type EditableCaregiver = {
  id: string;
  label: string;
  permissions: CaregiverPermission[];
  accessExpiresAt: string;
  moodWindowDays: AccessWindowDays;
  medicationWindowDays: AccessWindowDays;
};

export function CaregiverContent() {
  const { locale, t } = useI18n();
  const dateLocale = locale === "fr" ? fr : enUS;
  const localeTag = locale === "fr" ? "fr-FR" : "en-US";
  const roleLabelKeys: Record<string, string> = {
    family: "caregiver.roles.family",
    friend: "caregiver.roles.friend",
    professional: "caregiver.roles.professional",
  };
  const queryClient = useQueryClient();

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "family" | "friend" | "professional"
  >("family");
  const [inviteLabel, setInviteLabel] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<
    CaregiverPermission[]
  >(["view_mood", "add_observations", "add_events"]);
  const [inviteMoodWindowDays, setInviteMoodWindowDays] =
    useState<AccessWindowDays>(30);
  const [inviteMedicationWindowDays, setInviteMedicationWindowDays] =
    useState<AccessWindowDays>(30);
  const [inviteAccessExpiresOn, setInviteAccessExpiresOn] = useState("");
  const [editingCaregiver, setEditingCaregiver] =
    useState<EditableCaregiver | null>(null);

  const permissionLabels: Record<CaregiverPermission, string> = {
    view_mood: t("caregiver.dashboard.permissions.viewMood"),
    view_medications: t("caregiver.dashboard.permissions.viewMedications"),
    add_observations: t("caregiver.dashboard.permissions.addObservations"),
    add_events: t("caregiver.dashboard.permissions.addEvents"),
  };
  const accessResourceLabels: Record<string, string> = {
    shared_space: t("caregiver.dashboard.accessLog.sharedSpace"),
    activity: t("caregiver.dashboard.accessLog.activity"),
    mood_summary: t("caregiver.dashboard.accessLog.moodSummary"),
    medication_summary: t("caregiver.dashboard.accessLog.medicationSummary"),
  };
  const togglePermission = (
    current: CaregiverPermission[],
    permission: CaregiverPermission,
  ) =>
    current.includes(permission)
      ? current.filter((value) => value !== permission)
      : [...current, permission];
  const endOfUtcDate = (date: string) =>
    date ? `${date}T23:59:59.000Z` : undefined;

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["my-patients"],
    queryFn: async () => {
      const result = await getMyPatients();
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  const hasPatients = (patients?.length ?? 0) > 0;
  const activityScope = hasPatients
    ? ({
        kind: "relationship",
        relationshipId: patients?.[0]?.id ?? "",
      } as const)
    : ({ kind: "patient" } as const);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["caregiver-summary", activityScope],
    queryFn: async () => {
      const result = await getCaregiverSummary({ scope: activityScope });
      if (result.serverError) throw new Error(result.serverError);
      return result.data as CaregiverSummary;
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["caregiver-activity", activityScope],
    queryFn: async () => {
      const result = await getCaregiverActivity({
        days: 30,
        limit: 10,
        scope: activityScope,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const { data: caregivers, isLoading: caregiversLoading } = useQuery({
    queryKey: ["my-caregivers"],
    queryFn: async () => {
      const result = await getMyCaregivers();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const {
    data: accessLog,
    isLoading: accessLogLoading,
    isError: accessLogError,
  } = useQuery({
    queryKey: ["caregiver-access-log"],
    queryFn: async () => {
      const result = await getCaregiverAccessLog({ limit: 8 });
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  const { data: digestPreferences } = useQuery({
    queryKey: ["caregiver-digest-preferences"],
    queryFn: async () => {
      const result = await getCaregiverDigestPreferences();
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await inviteCaregiver({
        email: inviteEmail,
        role: inviteRole,
        label: inviteLabel || undefined,
        permissions: invitePermissions,
        moodWindowDays: inviteMoodWindowDays,
        medicationWindowDays: inviteMedicationWindowDays,
        accessExpiresAt: endOfUtcDate(inviteAccessExpiresOn),
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("caregiver.dashboard.toasts.inviteSent"));
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteLabel("");
      setInvitePermissions(["view_mood", "add_observations", "add_events"]);
      setInviteMoodWindowDays(30);
      setInviteMedicationWindowDays(30);
      setInviteAccessExpiresOn("");
      void queryClient.invalidateQueries({ queryKey: ["my-caregivers"] });
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      const result = await removeCaregiverRelationship({ relationshipId });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("caregiver.dashboard.toasts.removed"));
      void queryClient.invalidateQueries({ queryKey: ["my-caregivers"] });
      void queryClient.invalidateQueries({
        queryKey: ["caregiver-access-log"],
      });
    },
    onError: (error) => {
      toast.error(t(error.message));
    },
  });

  const digestMutation = useMutation({
    mutationFn: async (next: {
      enabled: boolean;
      frequency: "daily" | "weekly";
    }) => {
      const result = await updateCaregiverDigestPreferences(next);
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["caregiver-digest-preferences"],
      });
      toast.success(t("caregiver.dashboard.digest.saved"));
    },
    onError: () => toast.error(t("caregiver.dashboard.digest.saveError")),
  });

  const accessMutation = useMutation({
    mutationFn: async (next: EditableCaregiver) => {
      const result = await updateCaregiverPermissions({
        relationshipId: next.id,
        label: next.label || undefined,
        permissions: next.permissions,
        accessExpiresAt: endOfUtcDate(next.accessExpiresAt) ?? null,
        moodWindowDays: next.moodWindowDays,
        medicationWindowDays: next.medicationWindowDays,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      setEditingCaregiver(null);
      void queryClient.invalidateQueries({ queryKey: ["my-caregivers"] });
      toast.success(t("caregiver.dashboard.permissions.saved"));
    },
    onError: (error) => toast.error(t(error.message)),
  });

  // Today's date
  const today = new Date().toLocaleDateString(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const activityCount = activity?.length ?? 0;
  const activityCountLabel =
    activityCount === 1
      ? t("caregiver.dashboard.activity.entry")
      : t("caregiver.dashboard.activity.entries");

  return (
    <PageLayout
      title={t("caregiver.dashboard.title")}
      subtitle={today}
      maxWidth="5xl"
      action={{
        label: t("caregiver.dashboard.newObservation"),
        href: "/caregiver/observe",
        icon: Plus,
      }}
    >
      <section className="mb-8 grid items-center gap-4 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#e8f2ee,#eee7f5)] px-6 py-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:px-8">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-[#1e7775] uppercase">
            {locale === "fr" ? "Partage choisi" : "Sharing by choice"}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-caption)] text-2xl font-bold tracking-[-0.02em] text-[#18312f]">
            {locale === "fr"
              ? "Chacun voit exactement ce que tu as décidé."
              : "Everyone sees exactly what you decided."}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#61716f]">
            {locale === "fr"
              ? "Les notes privées restent privées et aucun signal automatique n’est envoyé."
              : "Private notes stay private and no automatic signal is ever sent."}
          </p>
        </div>
        <BrandIllustration
          variant="circle"
          sizes="220px"
          className="mx-auto max-h-32 w-auto"
        />
      </section>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-3xl" />
            ))}
          </>
        ) : (
          <>
            {/* Observations this week */}
            <GlassCard padding="md" variant="elevated">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Eye className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {t("caregiver.dashboard.stats.week")}
                  </p>
                  <p className="text-2xl font-bold">
                    {summary?.observationsThisWeek ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Observations this month */}
            <GlassCard padding="md" variant="elevated">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--sage)]/10 text-[var(--sage)]">
                  <Activity className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {t("caregiver.dashboard.stats.month")}
                  </p>
                  <p className="text-2xl font-bold">
                    {summary?.observationsThisMonth ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Events this month */}
            <GlassCard padding="md" variant="elevated">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                  <AlertTriangle className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {t("caregiver.dashboard.stats.events")}
                  </p>
                  <p className="text-2xl font-bold">
                    {summary?.eventsThisMonth ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Concerning events */}
            <GlassCard
              padding="md"
              variant="elevated"
              className={cn(
                summary?.concerningEvents && summary.concerningEvents > 0
                  ? "border-red-200 bg-red-50/50"
                  : "",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-14 items-center justify-center rounded-2xl",
                    summary?.concerningEvents && summary.concerningEvents > 0
                      ? "bg-red-100 text-red-500"
                      : "bg-[var(--sage)]/10 text-[var(--sage)]",
                  )}
                >
                  <Shield className="size-7" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    {t("caregiver.dashboard.stats.concerning")}
                  </p>
                  <p className="text-2xl font-bold">
                    {summary?.concerningEvents ?? 0}
                  </p>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Link
          href="/caregiver/observe"
          className="glass-card group flex items-center gap-4 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-md"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all group-hover:bg-[var(--primary)] group-hover:text-white">
            <Eye className="size-6" />
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {t("caregiver.dashboard.actions.checkin.title")}
            </p>
            <p className="text-sm text-gray-500">
              {t("caregiver.dashboard.actions.checkin.subtitle")}
            </p>
          </div>
          <ChevronRight className="ml-auto size-5 text-gray-300 transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/caregiver/observe?tab=event"
          className="glass-card group flex items-center gap-4 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-md"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500 transition-all group-hover:bg-orange-500 group-hover:text-white">
            <AlertTriangle className="size-6" />
          </div>
          <div>
            <p className="font-bold text-gray-800">
              {t("caregiver.dashboard.actions.event.title")}
            </p>
            <p className="text-sm text-gray-500">
              {t("caregiver.dashboard.actions.event.subtitle")}
            </p>
          </div>
          <ChevronRight className="ml-auto size-5 text-gray-300 transition-transform group-hover:translate-x-1" />
        </Link>

        <button
          className="glass-card group flex items-center gap-4 rounded-2xl p-5 transition-all hover:bg-white hover:shadow-md"
          onClick={() => setInviteDialogOpen(true)}
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--lavender)]/20 text-[var(--lavender-dark)] transition-all group-hover:bg-[var(--lavender-dark)] group-hover:text-white">
            <UserPlus className="size-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">
              {t("caregiver.dashboard.actions.invite.title")}
            </p>
            <p className="text-sm text-gray-500">
              {t("caregiver.dashboard.actions.invite.subtitle")}
            </p>
          </div>
          <ChevronRight className="ml-auto size-5 text-gray-300 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Activity Feed */}
        <div className="lg:col-span-8">
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Activity className="size-5 text-[var(--primary)]" />}
              >
                {t("caregiver.dashboard.activity.title")}
              </GlassCardTitle>
              <GlassCardBadge>
                {activityCount} {activityCountLabel}
              </GlassCardBadge>
            </GlassCardHeader>

            <GlassCardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : !activity || activity.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gray-100">
                    <Eye className="size-8 text-gray-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-800">
                    {t("caregiver.dashboard.activity.emptyTitle")}
                  </h3>
                  <p className="mb-6 text-sm text-gray-500">
                    {t("caregiver.dashboard.activity.emptyDescription")}
                  </p>
                  <Button
                    asChild
                    className="rounded-2xl bg-[var(--primary)] font-bold text-white"
                  >
                    <Link href="/caregiver/observe">
                      <Plus className="mr-2 size-4" />
                      {t("caregiver.dashboard.activity.emptyCta")}
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activity.map((item) => {
                    const timeAgo = formatDistanceToNow(
                      new Date(item.createdAt),
                      {
                        addSuffix: true,
                        locale: dateLocale,
                      },
                    );

                    if (item.type === "observation") {
                      const moodColor = item.moodObserved
                        ? moodObservedColors[item.moodObserved as MoodObserved]
                        : undefined;
                      const moodLabelKey = item.moodObserved
                        ? moodObservedLabels[item.moodObserved as MoodObserved]
                        : undefined;
                      const moodLabel = moodLabelKey
                        ? t(moodLabelKey)
                        : undefined;
                      const energyLabelKey = item.energyObserved
                        ? energyObservedLabels[
                            item.energyObserved as
                              | "high"
                              | "normal"
                              | "low"
                              | "very_low"
                          ]
                        : undefined;
                      const energyLabel = energyLabelKey
                        ? t(energyLabelKey)
                        : undefined;

                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
                        >
                          <Avatar className="size-12 border-2 border-white shadow-sm">
                            <AvatarImage src={item.subjectImage ?? undefined} />
                            <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
                              {item.subjectName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">
                                {item.subjectName}
                              </span>
                              <Badge
                                variant="outline"
                                className="rounded-lg border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[10px] font-bold text-[var(--primary)]"
                              >
                                <Eye className="mr-1 size-3" />
                                {t(
                                  "caregiver.dashboard.activity.badgeObservation",
                                )}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {moodLabel && (
                                <span
                                  className="rounded-lg px-2 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: `${moodColor}15`,
                                    color: moodColor,
                                  }}
                                >
                                  {t("caregiver.dashboard.activity.moodLabel")}{" "}
                                  {moodLabel}
                                </span>
                              )}
                              {energyLabel && (
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                                  {t(
                                    "caregiver.dashboard.activity.energyLabel",
                                  )}{" "}
                                  {energyLabel}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                                {item.notes}
                              </p>
                            )}
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                              <Clock className="size-3" />
                              {timeAgo}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Event type
                    const eventColor =
                      eventTypeColors[item.eventType as EventType];
                    const eventLabelKey =
                      eventTypeLabels[item.eventType as EventType];
                    const eventLabel = t(eventLabelKey);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm",
                          item.severity >= 4
                            ? "border-red-200 bg-red-50/50"
                            : item.severity >= 3
                              ? "border-orange-200 bg-orange-50/50"
                              : "border-gray-100 bg-white",
                        )}
                      >
                        <Avatar className="size-12 border-2 border-white shadow-sm">
                          <AvatarImage src={item.subjectImage ?? undefined} />
                          <AvatarFallback className="bg-orange-100 text-orange-500">
                            {item.subjectName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">
                              {item.subjectName}
                            </span>
                            <Badge
                              className="rounded-lg text-[10px] font-bold"
                              style={{
                                backgroundColor: `${eventColor}15`,
                                color: eventColor,
                                borderColor: eventColor,
                              }}
                            >
                              <AlertTriangle className="mr-1 size-3" />
                              {eventLabel}
                            </Badge>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                            {item.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <Clock className="size-3" />
                              {timeAgo}
                            </span>
                            <span
                              className={cn(
                                "rounded-lg px-2 py-0.5 text-xs font-bold",
                                item.severity >= 4
                                  ? "bg-red-100 text-red-600"
                                  : item.severity >= 3
                                    ? "bg-orange-100 text-orange-600"
                                    : "bg-gray-100 text-gray-600",
                              )}
                            >
                              {t("caregiver.dashboard.activity.severity", {
                                value: item.severity,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCardContent>
          </GlassCard>
        </div>

        {/* Side Panel */}
        <div className="space-y-6 lg:col-span-4">
          {/* My Patients (caregiver view) */}
          {(patientsLoading || hasPatients) && (
            <GlassCard padding="md" variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle
                  icon={<Users className="size-5 text-[var(--primary)]" />}
                >
                  {t("caregiver.dashboard.patients.title")}
                </GlassCardTitle>
              </GlassCardHeader>

              <GlassCardContent className="space-y-4">
                {patientsLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : patients && patients.length > 0 ? (
                  patients.map((patient) => (
                    <div key={patient.id} className="flex items-center gap-3">
                      <Avatar className="size-12 border-2 border-white shadow-sm">
                        <AvatarImage src={patient.patientImage ?? undefined} />
                        <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
                          {patient.patientName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-grow">
                        <p className="font-bold text-gray-800">
                          {patient.patientName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {patient.patientEmail}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">
                      {t("caregiver.dashboard.patients.empty")}
                    </p>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          )}

          {/* My Care Circle */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Users className="size-5 text-[var(--primary)]" />}
              >
                {t("caregiver.dashboard.circle.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent className="space-y-4">
              {caregiversLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : caregivers && caregivers.length > 0 ? (
                caregivers.map((caregiver) => {
                  const displayName =
                    [
                      caregiver.label,
                      caregiver.caregiverName,
                      caregiver.caregiverEmail,
                    ].find((v) => v) ?? t("caregiver.dashboard.circle.default");

                  return (
                    <div key={caregiver.id} className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="size-12 border-2 border-white shadow-sm">
                          <AvatarImage
                            src={caregiver.caregiverImage ?? undefined}
                          />
                          <AvatarFallback className="bg-[var(--primary)]/10 text-[var(--primary)]">
                            {displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {caregiver.status === "active" && (
                          <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-white bg-[var(--sage)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="font-bold text-gray-800">{displayName}</p>
                        <p className="text-xs text-gray-600">
                          {roleLabelKeys[caregiver.role]
                            ? t(roleLabelKeys[caregiver.role])
                            : caregiver.role}
                          {caregiver.status === "pending" &&
                            ` • ${t(
                              "caregiver.dashboard.circle.statusPending",
                            )}`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(caregiver.permissions as CaregiverPermission[]).map(
                            (permission) => (
                              <Badge
                                key={permission}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {permissionLabels[permission]}
                              </Badge>
                            ),
                          )}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          {t("caregiver.dashboard.permissions.windows", {
                            mood: caregiver.moodWindowDays,
                            medication: caregiver.medicationWindowDays,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {caregiver.accessExpiresAt
                            ? t("caregiver.dashboard.permissions.expires", {
                                date: new Date(
                                  caregiver.accessExpiresAt,
                                ).toLocaleDateString(localeTag),
                              })
                            : t("caregiver.dashboard.permissions.noExpiry")}
                        </p>
                      </div>
                      {caregiver.status !== "revoked" ? (
                        <button
                          type="button"
                          aria-label={t(
                            "caregiver.dashboard.permissions.manageAccessibleLabel",
                            { name: displayName },
                          )}
                          className="flex size-11 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-all hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                          onClick={() =>
                            setEditingCaregiver({
                              id: caregiver.id,
                              label: caregiver.label ?? "",
                              permissions:
                                caregiver.permissions as CaregiverPermission[],
                              accessExpiresAt:
                                caregiver.accessExpiresAt?.slice(0, 10) ?? "",
                              moodWindowDays:
                                caregiver.moodWindowDays as AccessWindowDays,
                              medicationWindowDays:
                                caregiver.medicationWindowDays as AccessWindowDays,
                            })
                          }
                        >
                          <Settings2 className="size-4" />
                        </button>
                      ) : null}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            aria-label={t(
                              "caregiver.dashboard.circle.removeAccessibleLabel",
                              { name: displayName },
                            )}
                            className="flex size-11 items-center justify-center rounded-xl bg-gray-50 text-gray-600 transition-all hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("caregiver.dashboard.circle.removeTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t(
                                "caregiver.dashboard.circle.removeDescription",
                                {
                                  name: displayName,
                                },
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {t("actions.cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                removeMutation.mutate(caregiver.id)
                              }
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {t("caregiver.dashboard.circle.removeConfirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">
                    {t("caregiver.dashboard.circle.empty")}
                  </p>
                </div>
              )}

              <button
                onClick={() => setInviteDialogOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <UserPlus className="size-4" />
                {t("caregiver.dashboard.circle.inviteCta")}
              </button>
            </GlassCardContent>
          </GlassCard>

          {/* Patient-visible caregiver access trail */}
          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Shield className="size-5 text-[var(--sage)]" />}
              >
                {t("caregiver.dashboard.accessLog.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent>
              <p className="mb-4 text-sm leading-relaxed text-gray-500">
                {t("caregiver.dashboard.accessLog.description")}
              </p>
              {accessLogLoading ? (
                <div className="space-y-3" aria-busy="true">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : accessLogError ? (
                <p className="text-sm text-red-700" role="alert">
                  {t("caregiver.dashboard.accessLog.error")}
                </p>
              ) : accessLog && accessLog.length > 0 ? (
                <ol className="space-y-3">
                  {accessLog.map((entry) => (
                    <li key={entry.id} className="flex items-center gap-3">
                      <Avatar className="size-10 border border-white shadow-sm">
                        <AvatarImage src={entry.caregiverImage ?? undefined} />
                        <AvatarFallback className="bg-[var(--sage)]/10 text-[var(--sage)]">
                          {entry.caregiverName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-grow">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {entry.caregiverName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {accessResourceLabels[entry.resource] ??
                            t("caregiver.dashboard.accessLog.sharedSpace")}
                        </p>
                      </div>
                      <time
                        className="shrink-0 text-xs text-gray-600"
                        dateTime={entry.accessedAt}
                        title={new Date(entry.accessedAt).toLocaleString(
                          localeTag,
                        )}
                      >
                        {formatDistanceToNow(new Date(entry.accessedAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </time>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-500">
                  {t("caregiver.dashboard.accessLog.empty")}
                </p>
              )}
            </GlassCardContent>
          </GlassCard>

          <GlassCard padding="md" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Shield className="size-5 text-[var(--primary)]" />}
              >
                {t("caregiver.dashboard.digest.title")}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-500">
                {t("caregiver.dashboard.digest.description")}
              </p>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-3 text-sm font-semibold text-gray-700">
                {t("caregiver.dashboard.digest.enabled")}
                <input
                  type="checkbox"
                  checked={digestPreferences?.enabled ?? true}
                  disabled={!digestPreferences || digestMutation.isPending}
                  onChange={(event) =>
                    digestMutation.mutate({
                      enabled: event.target.checked,
                      frequency: digestPreferences?.frequency ?? "weekly",
                    })
                  }
                  className="size-5 accent-[var(--primary)]"
                />
              </label>
              <label className="block space-y-2 text-sm font-semibold text-gray-700">
                <span>{t("caregiver.dashboard.digest.frequency")}</span>
                <select
                  value={digestPreferences?.frequency ?? "weekly"}
                  disabled={
                    !digestPreferences?.enabled || digestMutation.isPending
                  }
                  onChange={(event) =>
                    digestMutation.mutate({
                      enabled: digestPreferences?.enabled ?? true,
                      frequency: event.target.value as "daily" | "weekly",
                    })
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3"
                >
                  <option value="daily">
                    {t("caregiver.dashboard.digest.daily")}
                  </option>
                  <option value="weekly">
                    {t("caregiver.dashboard.digest.weekly")}
                  </option>
                </select>
              </label>
              <p className="text-xs leading-relaxed text-gray-500">
                {t("caregiver.dashboard.digest.privacy")}
              </p>
            </GlassCardContent>
          </GlassCard>

          {/* Tips Card */}
          <GlassCard
            padding="md"
            variant="elevated"
            className="border-[var(--lavender)]/20 bg-[var(--lavender)]/10"
          >
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Eye className="size-5 text-[var(--lavender-dark)]" />}
              >
                {t("caregiver.dashboard.tips.title")}
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent>
              <p className="text-sm leading-relaxed text-gray-700">
                <span className="font-bold text-[var(--lavender-dark)]">
                  {t("caregiver.dashboard.tips.highlight")}
                </span>{" "}
                {t("caregiver.dashboard.tips.body")}
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("caregiver.dashboard.inviteDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("caregiver.dashboard.inviteDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                {t("caregiver.dashboard.inviteDialog.emailLabel")}
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t(
                  "caregiver.dashboard.inviteDialog.emailPlaceholder",
                )}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">
                {t("caregiver.dashboard.inviteDialog.roleLabel")}
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(v) =>
                  setInviteRole(v as "family" | "friend" | "professional")
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
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">
                {t("caregiver.dashboard.permissions.title")}
              </legend>
              {caregiverPermissionValues.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={invitePermissions.includes(permission)}
                    onChange={() =>
                      setInvitePermissions((current) =>
                        togglePermission(current, permission),
                      )
                    }
                  />
                  {permissionLabels[permission]}
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <Label className="space-y-2">
                <span>{t("caregiver.dashboard.permissions.moodWindow")}</span>
                <select
                  value={inviteMoodWindowDays}
                  onChange={(event) =>
                    setInviteMoodWindowDays(
                      Number(event.target.value) as AccessWindowDays,
                    )
                  }
                  className="h-11 w-full rounded-xl border px-3"
                >
                  {[7, 30, 90].map((days) => (
                    <option key={days} value={days}>
                      {t("caregiver.dashboard.permissions.days", { days })}
                    </option>
                  ))}
                </select>
              </Label>
              <Label className="space-y-2">
                <span>
                  {t("caregiver.dashboard.permissions.medicationWindow")}
                </span>
                <select
                  value={inviteMedicationWindowDays}
                  onChange={(event) =>
                    setInviteMedicationWindowDays(
                      Number(event.target.value) as AccessWindowDays,
                    )
                  }
                  className="h-11 w-full rounded-xl border px-3"
                >
                  {[7, 30, 90].map((days) => (
                    <option key={days} value={days}>
                      {t("caregiver.dashboard.permissions.days", { days })}
                    </option>
                  ))}
                </select>
              </Label>
            </div>
            <Label htmlFor="invite-expiry" className="space-y-2">
              <span>{t("caregiver.dashboard.permissions.expiry")}</span>
              <Input
                id="invite-expiry"
                type="date"
                value={inviteAccessExpiresOn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(event) =>
                  setInviteAccessExpiresOn(event.target.value)
                }
              />
            </Label>
            <div className="space-y-2">
              <Label htmlFor="invite-label">
                {t("caregiver.dashboard.inviteDialog.labelLabel")}
              </Label>
              <Input
                id="invite-label"
                placeholder={t(
                  "caregiver.dashboard.inviteDialog.labelPlaceholder",
                )}
                value={inviteLabel}
                onChange={(e) => setInviteLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending
                ? t("caregiver.dashboard.inviteDialog.sending")
                : t("caregiver.dashboard.inviteDialog.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingCaregiver !== null}
        onOpenChange={(open) => !open && setEditingCaregiver(null)}
      >
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("caregiver.dashboard.permissions.manageTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("caregiver.dashboard.permissions.manageDescription")}
            </DialogDescription>
          </DialogHeader>
          {editingCaregiver ? (
            <div className="space-y-4 py-4">
              <Label className="space-y-2">
                <span>{t("caregiver.dashboard.inviteDialog.labelLabel")}</span>
                <Input
                  value={editingCaregiver.label}
                  onChange={(event) =>
                    setEditingCaregiver({
                      ...editingCaregiver,
                      label: event.target.value,
                    })
                  }
                />
              </Label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">
                  {t("caregiver.dashboard.permissions.title")}
                </legend>
                {caregiverPermissionValues.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-3 rounded-xl border p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={editingCaregiver.permissions.includes(
                        permission,
                      )}
                      onChange={() =>
                        setEditingCaregiver({
                          ...editingCaregiver,
                          permissions: togglePermission(
                            editingCaregiver.permissions,
                            permission,
                          ),
                        })
                      }
                    />
                    {permissionLabels[permission]}
                  </label>
                ))}
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["moodWindowDays", "medicationWindowDays"] as const).map(
                  (field) => (
                    <Label key={field} className="space-y-2">
                      <span>
                        {t(
                          field === "moodWindowDays"
                            ? "caregiver.dashboard.permissions.moodWindow"
                            : "caregiver.dashboard.permissions.medicationWindow",
                        )}
                      </span>
                      <select
                        value={editingCaregiver[field]}
                        onChange={(event) =>
                          setEditingCaregiver({
                            ...editingCaregiver,
                            [field]: Number(
                              event.target.value,
                            ) as AccessWindowDays,
                          })
                        }
                        className="h-11 w-full rounded-xl border px-3"
                      >
                        {[7, 30, 90].map((days) => (
                          <option key={days} value={days}>
                            {t("caregiver.dashboard.permissions.days", {
                              days,
                            })}
                          </option>
                        ))}
                      </select>
                    </Label>
                  ),
                )}
              </div>
              <Label className="space-y-2">
                <span>{t("caregiver.dashboard.permissions.expiry")}</span>
                <Input
                  type="date"
                  value={editingCaregiver.accessExpiresAt}
                  onChange={(event) =>
                    setEditingCaregiver({
                      ...editingCaregiver,
                      accessExpiresAt: event.target.value,
                    })
                  }
                />
              </Label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCaregiver(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              disabled={!editingCaregiver || accessMutation.isPending}
              onClick={() =>
                editingCaregiver && accessMutation.mutate(editingCaregiver)
              }
            >
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
