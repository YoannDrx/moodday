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
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

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
  getCaregiverActivity,
  getCaregiverSummary,
  getMyCaregivers,
  getMyPatients,
  inviteCaregiver,
  removeCaregiverRelationship,
} from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

type CaregiverSummary = {
  observationsThisWeek: number;
  observationsThisMonth: number;
  eventsThisMonth: number;
  concerningEvents: number;
};

const roleLabels: Record<string, string> = {
  family: "Famille",
  friend: "Ami(e)",
  professional: "Professionnel",
};

export function CaregiverContent() {
  const { locale } = useI18n();
  const lang = locale === "fr" ? "fr" : "en";
  const queryClient = useQueryClient();

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "family" | "friend" | "professional"
  >("family");
  const [inviteLabel, setInviteLabel] = useState("");

  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["my-patients"],
    queryFn: async () => {
      const result = await getMyPatients();
      if (result.serverError) throw new Error(result.serverError);
      return result.data ?? [];
    },
  });

  const hasPatients = (patients?.length ?? 0) > 0;
  const activityMode = hasPatients ? "caregiver" : "patient";

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["caregiver-summary", activityMode],
    queryFn: async () => {
      const result = await getCaregiverSummary({ mode: activityMode });
      if (result.serverError) throw new Error(result.serverError);
      return result.data as CaregiverSummary;
    },
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["caregiver-activity", activityMode],
    queryFn: async () => {
      const result = await getCaregiverActivity({
        days: 30,
        limit: 10,
        mode: activityMode,
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

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await inviteCaregiver({
        email: inviteEmail,
        role: inviteRole,
        label: inviteLabel || undefined,
      });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Invitation envoyée !");
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteLabel("");
      void queryClient.invalidateQueries({ queryKey: ["my-caregivers"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (relationshipId: string) => {
      const result = await removeCaregiverRelationship({ relationshipId });
      if (result.serverError) throw new Error(result.serverError);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Aidant retiré du cercle");
      void queryClient.invalidateQueries({ queryKey: ["my-caregivers"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Today's date
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8">
      {/* Background Decorations */}
      <div className="blob blob-primary -top-[200px] -left-[100px]" />
      <div className="blob blob-lavender -right-[100px] -bottom-[200px]" />

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
              Cercle d&apos;aidants
            </h1>
            <p className="text-gray-500">{today}</p>
          </div>
          <Button
            asChild
            className="shadow-soft rounded-2xl bg-[var(--primary)] px-6 font-bold text-white transition-all hover:bg-[var(--primary-dark)]"
          >
            <Link href="/caregiver/observe">
              <Plus className="mr-2 size-4" />
              Nouvelle observation
            </Link>
          </Button>
        </div>
      </header>

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
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Cette semaine
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
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Ce mois
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
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    Événements
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
                  <p className="text-xs font-semibold text-gray-400 uppercase">
                    À surveiller
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
            <p className="font-bold text-gray-800">Check-in quotidien</p>
            <p className="text-sm text-gray-500">Observer l&apos;humeur</p>
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
            <p className="font-bold text-gray-800">Signaler un événement</p>
            <p className="text-sm text-gray-500">Situation préoccupante</p>
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
            <p className="font-bold text-gray-800">Inviter un aidant</p>
            <p className="text-sm text-gray-500">Partager l&apos;accès</p>
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
                Activité récente
              </GlassCardTitle>
              <GlassCardBadge>{activity?.length ?? 0} entrées</GlassCardBadge>
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
                    <Eye className="size-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-800">
                    Aucune activité
                  </h3>
                  <p className="mb-6 text-sm text-gray-500">
                    Vos observations et événements apparaîtront ici
                  </p>
                  <Button
                    asChild
                    className="rounded-2xl bg-[var(--primary)] font-bold text-white"
                  >
                    <Link href="/caregiver/observe">
                      <Plus className="mr-2 size-4" />
                      Première observation
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
                        locale: fr,
                      },
                    );

                    if (item.type === "observation") {
                      const moodColor = item.moodObserved
                        ? moodObservedColors[item.moodObserved as MoodObserved]
                        : undefined;
                      const moodLabel = item.moodObserved
                        ? moodObservedLabels[item.moodObserved as MoodObserved][
                            lang
                          ]
                        : undefined;
                      const energyLabel = item.energyObserved
                        ? energyObservedLabels[
                            item.energyObserved as
                              | "high"
                              | "normal"
                              | "low"
                              | "very_low"
                          ][lang]
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
                                Observation
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
                                  Humeur: {moodLabel}
                                </span>
                              )}
                              {energyLabel && (
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                                  Énergie: {energyLabel}
                                </span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                                {item.notes}
                              </p>
                            )}
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
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
                    const eventLabel =
                      eventTypeLabels[item.eventType as EventType][lang];

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
                            <span className="flex items-center gap-1 text-xs text-gray-400">
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
                              Sévérité: {item.severity}/5
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
                  Mes patients
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
                        <p className="text-xs text-gray-400">
                          {patient.patientEmail}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500">
                      Aucun patient assigné
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
                Mon cercle
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
                    caregiver.label ||
                    caregiver.caregiverName ||
                    caregiver.caregiverEmail ||
                    "Aidant";

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
                        <p className="font-bold text-gray-800">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {roleLabels[caregiver.role] || caregiver.role}
                          {caregiver.status === "pending" && " • En attente"}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="flex size-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="size-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Retirer cet aidant ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {displayName} n&apos;aura plus accès à vos données.
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeMutation.mutate(caregiver.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Retirer
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
                    Aucun aidant dans votre cercle
                  </p>
                </div>
              )}

              <button
                onClick={() => setInviteDialogOpen(true)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-3 text-sm font-semibold text-gray-400 transition-all hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                <UserPlus className="size-4" />
                Inviter un aidant
              </button>
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
                Conseil du jour
              </GlassCardTitle>
            </GlassCardHeader>

            <GlassCardContent>
              <p className="text-sm leading-relaxed text-gray-700">
                <span className="font-bold text-[var(--lavender-dark)]">
                  Observez sans juger.
                </span>{" "}
                Notez ce que vous voyez de manière factuelle : comportements,
                expressions, activités. Évitez les interprétations.
              </p>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un aidant</DialogTitle>
            <DialogDescription>
              Envoyez une invitation à un proche ou un professionnel pour
              qu&apos;il puisse suivre votre parcours.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="email@exemple.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Type d&apos;aidant</Label>
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
                  <SelectItem value="family">Famille</SelectItem>
                  <SelectItem value="friend">Ami(e)</SelectItem>
                  <SelectItem value="professional">
                    Professionnel de santé
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-label">Surnom (optionnel)</Label>
              <Input
                id="invite-label"
                placeholder="Ex: Maman, Dr. Martin..."
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
              Annuler
            </Button>
            <Button
              onClick={() => inviteMutation.mutate()}
              disabled={!inviteEmail || inviteMutation.isPending}
            >
              {inviteMutation.isPending ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
