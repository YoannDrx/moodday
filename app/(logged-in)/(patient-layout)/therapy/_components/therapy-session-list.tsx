"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GlassCard,
  GlassCardBadge,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { BenefitRating } from "@/components/nowts/benefit-rating";
import {
  getTherapySessions,
  deleteTherapySession,
  updateTherapySession,
} from "@/features/therapy/therapy.action";
import { useI18n } from "@/i18n/provider";
import {
  getDateKeyForTimeZone,
  getSafeTimeZone,
} from "@/lib/temporal/civil-date";
import { cn } from "@/lib/utils";

type EditingSession = {
  id: string;
  date: string;
  notes: string;
  benefitRating: number | null;
};

export function TherapySessionList() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [editingSession, setEditingSession] = useState<EditingSession | null>(
    null,
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["therapySessions"],
    queryFn: async () => {
      const result = await getTherapySessions({ limit: 50 });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteTherapySession({ id });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("therapy.delete.success"));
      void queryClient.invalidateQueries({ queryKey: ["therapySessions"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (session: EditingSession) => {
      const result = await updateTherapySession({
        id: session.id,
        date: session.date,
        notes: session.notes,
        benefitRating: session.benefitRating,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("therapy.edit.success"));
      setEditingSession(null);
      void queryClient.invalidateQueries({ queryKey: ["therapySessions"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const openEditDialog = (session: {
    id: string;
    date: Date | string;
    notes: string;
    benefitRating: number | null;
  }) => {
    const dateObj =
      session.date instanceof Date ? session.date : new Date(session.date);
    setEditingSession({
      id: session.id,
      date: getDateKeyForTimeZone(dateObj, getSafeTimeZone(data?.timezone)),
      notes: session.notes,
      benefitRating: session.benefitRating,
    });
  };

  const sessions = data?.sessions ?? [];
  const timezone = getSafeTimeZone(data?.timezone);

  // Today's date
  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );

  return (
    <PageLayout
      title={t("therapy.list.title")}
      subtitle={today}
      maxWidth="5xl"
      action={{
        label: t("therapy.list.addNew"),
        href: "/therapy/new",
        icon: Plus,
      }}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <GlassCard padding="lg" className="text-center">
          <p className="text-gray-500">{t("common.error")}</p>
        </GlassCard>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sessions.length === 0 && (
        <GlassCard padding="lg" className="py-16 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
            <Calendar className="size-10 text-[var(--primary)]" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-800">
            {t("therapy.list.emptyTitle")}
          </h3>
          <p className="mb-6 text-gray-500">{t("therapy.list.empty")}</p>
          <Button
            asChild
            className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 py-3 font-bold text-white"
          >
            <Link href="/therapy/new">
              <Plus className="mr-2 size-4" />
              {t("therapy.list.addNew")}
            </Link>
          </Button>
        </GlassCard>
      )}

      {/* Sessions list */}
      {!isLoading && !isError && sessions.length > 0 && (
        <GlassCard padding="md" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Calendar className="size-5 text-[var(--primary)]" />}
            >
              {t("therapy.list.mySessions")}
            </GlassCardTitle>
            <GlassCardBadge>
              {t("therapy.list.sessionCount", { count: sessions.length })}
            </GlassCardBadge>
          </GlassCardHeader>

          <GlassCardContent className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-4 transition-all",
                  session.benefitRating && session.benefitRating >= 4
                    ? "border-[var(--sage)]/20 bg-[var(--sage)]/5"
                    : "border-gray-100 bg-white hover:border-[var(--primary)]/30 hover:shadow-sm",
                )}
              >
                <div
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center rounded-xl",
                    session.benefitRating && session.benefitRating >= 4
                      ? "bg-[var(--sage)] text-white"
                      : "bg-[var(--primary)]/10 text-[var(--primary)]",
                  )}
                >
                  <Calendar className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <time
                      dateTime={getDateKeyForTimeZone(
                        new Date(session.date),
                        timezone,
                      )}
                      className={cn(
                        "font-bold",
                        session.benefitRating && session.benefitRating >= 4
                          ? "text-[var(--sage-dark)]"
                          : "text-gray-800",
                      )}
                    >
                      {new Date(session.date).toLocaleDateString(
                        locale === "fr" ? "fr-FR" : "en-US",
                        {
                          timeZone: timezone,
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </time>
                    {session.benefitRating && (
                      <BenefitRating
                        value={session.benefitRating}
                        readonly
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                    {session.notes}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                  onClick={() => openEditDialog(session)}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("therapy.delete.title")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("therapy.delete.description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("actions.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(session.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {t("therapy.delete.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editingSession !== null}
        onOpenChange={(open) => !open && setEditingSession(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("therapy.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("therapy.edit.description")}
            </DialogDescription>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">{t("therapy.form.date")}</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingSession.date}
                  max={getDateKeyForTimeZone(new Date(), timezone)}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">{t("therapy.form.notes")}</Label>
                <Textarea
                  id="edit-notes"
                  value={editingSession.notes}
                  onChange={(e) =>
                    setEditingSession({
                      ...editingSession,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("therapy.form.benefitRating")}</Label>
                <BenefitRating
                  value={editingSession.benefitRating ?? 0}
                  onChange={(value) =>
                    setEditingSession({
                      ...editingSession,
                      benefitRating: value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSession(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() =>
                editingSession && updateMutation.mutate(editingSession)
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending
                ? t("actions.saving")
                : t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
