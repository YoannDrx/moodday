"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Dumbbell,
  Archive,
  Check,
  MoreHorizontal,
  Undo2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getOfflineStorageErrorMessage } from "@/features/pwa/offline-store";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  getExercises,
  archiveExercise,
  unarchiveExercise,
  logExerciseCompletion,
  updateExercise,
} from "@/features/exercise/exercise.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";
import { cn } from "@/lib/utils";

type EditingExercise = {
  id: string;
  name: string;
  description: string | null;
};

export function ExerciseList() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [editingExercise, setEditingExercise] =
    useState<EditingExercise | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["exercises", showArchived],
    queryFn: async () => {
      const result = await getExercises({ includeArchived: showArchived });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const logMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueAction({ type: "exercise_log", exerciseId });
        return { queued: true };
      }
      const result = await logExerciseCompletion({ exerciseId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: (result) => {
      if ((result as { queued?: boolean }).queued) {
        toast.success(t("exercise.log.logged"));
        return;
      }
      toast.success(t("exercise.log.logged"));
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (error) => {
      toast.error(
        getOfflineStorageErrorMessage(error, {
          quota: t("common.offlineStorageFull"),
          fallback: t("common.error"),
        }),
      );
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await archiveExercise({ id });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("exercise.archive.success"));
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await unarchiveExercise({ id });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("exercise.unarchive.success"));
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (exercise: EditingExercise) => {
      const result = await updateExercise({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("exercise.edit.success"));
      setEditingExercise(null);
      void queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const openEditDialog = (exercise: {
    id: string;
    name: string;
    description: string | null;
  }) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
    });
  };

  const exercises = data ?? [];
  const activeExercises = exercises.filter((e) => !e.isArchived);
  const archivedExercises = exercises.filter((e) => e.isArchived);

  // Today's date
  const today = new Date().toLocaleDateString(
    locale === "fr" ? "fr-FR" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  );

  return (
    <PageLayout
      title={t("exercise.list.title")}
      subtitle={today}
      maxWidth="5xl"
      blobVariant="sage"
      action={{
        label: t("exercise.list.addNew"),
        href: "/exercises/new",
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
      {!isLoading &&
        !isError &&
        activeExercises.length === 0 &&
        !showArchived && (
          <GlassCard padding="lg" className="py-16 text-center">
            <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Dumbbell className="size-10 text-[var(--primary)]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">
              {t("exercise.list.emptyTitle")}
            </h3>
            <p className="mb-6 text-gray-500">{t("exercise.list.empty")}</p>
            <Button
              asChild
              className="shadow-soft rounded-2xl bg-[var(--primary)] px-8 py-3 font-bold text-white"
            >
              <Link href="/exercises/new">
                <Plus className="mr-2 size-4" />
                {t("exercise.list.addNew")}
              </Link>
            </Button>
          </GlassCard>
        )}

      {/* Active exercises */}
      {!isLoading && !isError && activeExercises.length > 0 && (
        <GlassCard padding="md" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Dumbbell className="size-5 text-[var(--primary)]" />}
            >
              {t("exercise.list.myExercises")}
            </GlassCardTitle>
            <GlassCardBadge>
              {t("exercise.list.activeCount", {
                count: activeExercises.length,
              })}
            </GlassCardBadge>
          </GlassCardHeader>

          <GlassCardContent className="space-y-3">
            {activeExercises.map((exercise) => {
              const todayCount = exercise.logs.length;
              const isPending = logMutation.isPending;

              return (
                <div
                  key={exercise.id}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                    todayCount > 0
                      ? "border-[var(--sage)]/20 bg-[var(--sage)]/5"
                      : "border-gray-100 bg-white hover:border-[var(--primary)]/30 hover:shadow-sm",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl",
                      todayCount > 0
                        ? "bg-[var(--sage)] text-white"
                        : "bg-[var(--primary)]/10 text-[var(--primary)]",
                    )}
                  >
                    <Dumbbell className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-bold",
                        todayCount > 0
                          ? "text-[var(--sage-dark)]"
                          : "text-gray-800",
                      )}
                    >
                      {exercise.name}
                    </p>
                    {exercise.description && (
                      <p className="line-clamp-1 text-sm text-gray-400">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  {todayCount > 0 && (
                    <Badge
                      variant="outline"
                      className="rounded-lg border-[var(--sage)]/30 bg-[var(--sage)]/10 text-[10px] font-bold text-[var(--sage-dark)]"
                    >
                      {t("exercise.log.todayCount", { count: todayCount })}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    onClick={() => logMutation.mutate(exercise.id)}
                    disabled={isPending}
                    className="rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                  >
                    <Check className="mr-1 size-4" />
                    {t("exercise.log.button")}
                  </Button>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(exercise)}
                        >
                          <Pencil className="mr-2 size-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem>
                            <Archive className="mr-2 size-4" />
                            {t("exercise.archive.confirm")}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("exercise.archive.title")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("exercise.archive.description")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("actions.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => archiveMutation.mutate(exercise.id)}
                        >
                          {t("exercise.archive.confirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Show archived toggle */}
      {(archivedExercises.length > 0 || showArchived) && (
        <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-white/50 px-4 py-3">
          <span className="text-sm text-gray-500">
            {showArchived
              ? t("exercise.list.hideArchived")
              : t("exercise.list.showArchived")}
          </span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </div>
      )}

      {/* Archived exercises */}
      {showArchived && archivedExercises.length > 0 && (
        <GlassCard padding="md" variant="default" className="mt-6 opacity-75">
          <GlassCardHeader>
            <GlassCardTitle icon={<Archive className="size-5 text-gray-400" />}>
              {t("exercise.list.archived")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {archivedExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 opacity-60"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                  <Dumbbell className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-600">{exercise.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unarchiveMutation.mutate(exercise.id)}
                  className="rounded-xl"
                >
                  <Undo2 className="mr-1 size-4" />
                  {t("exercise.unarchive.button")}
                </Button>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editingExercise !== null}
        onOpenChange={(open) => !open && setEditingExercise(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("exercise.edit.title")}</DialogTitle>
            <DialogDescription>
              {t("exercise.edit.description")}
            </DialogDescription>
          </DialogHeader>
          {editingExercise && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("exercise.form.name")}</Label>
                <Input
                  id="edit-name"
                  value={editingExercise.name}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">
                  {t("exercise.form.description")}
                </Label>
                <Textarea
                  id="edit-description"
                  value={editingExercise.description ?? ""}
                  onChange={(e) =>
                    setEditingExercise({
                      ...editingExercise,
                      description: e.target.value || null,
                    })
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExercise(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={() =>
                editingExercise && updateMutation.mutate(editingExercise)
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
