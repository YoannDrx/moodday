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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  getExercises,
  archiveExercise,
  unarchiveExercise,
  logExerciseCompletion,
  updateExercise,
} from "@/features/exercise/exercise.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";

type EditingExercise = {
  id: string;
  name: string;
  description: string | null;
};

export function ExerciseList() {
  const { t } = useI18n();
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
        queueAction({ type: "exercise_log", exerciseId });
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
      toast.error(error.message);
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
      </Card>
    );
  }

  const exercises = data ?? [];
  const activeExercises = exercises.filter((e) => !e.isArchived);
  const archivedExercises = exercises.filter((e) => e.isArchived);

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/exercises/new">
            <Plus className="mr-2 size-4" />
            {t("exercise.list.addNew")}
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {activeExercises.length === 0 && !showArchived && (
        <Card className="p-8 text-center">
          <Dumbbell className="text-muted-foreground mx-auto mb-4 size-12" />
          <p className="text-muted-foreground">{t("exercise.list.empty")}</p>
        </Card>
      )}

      {/* Active exercises */}
      {activeExercises.length > 0 && (
        <div className="space-y-3">
          {activeExercises.map((exercise) => {
            const todayCount = exercise.logs.length;
            const isPending = logMutation.isPending;

            return (
              <Card key={exercise.id} className="flex items-center gap-4 p-4">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Dumbbell className="text-primary size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{exercise.name}</p>
                  {exercise.description && (
                    <p className="text-muted-foreground line-clamp-1 text-sm">
                      {exercise.description}
                    </p>
                  )}
                </div>
                {todayCount > 0 && (
                  <Badge variant="secondary">
                    {t("exercise.log.todayCount", { count: todayCount })}
                  </Badge>
                )}
                <Button
                  size="sm"
                  onClick={() => logMutation.mutate(exercise.id)}
                  disabled={isPending}
                >
                  <Check className="mr-1 size-4" />
                  {t("exercise.log.button")}
                </Button>
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Show archived toggle */}
      {(archivedExercises.length > 0 || showArchived) && (
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-muted-foreground text-sm">
            {showArchived
              ? t("exercise.list.hideArchived")
              : t("exercise.list.showArchived")}
          </span>
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
        </div>
      )}

      {/* Archived exercises */}
      {showArchived && archivedExercises.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-muted-foreground text-lg font-semibold">
            <Archive className="mr-2 inline size-4" />
            {t("exercise.list.archived")}
          </h2>
          {archivedExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="flex items-center gap-4 p-4 opacity-60"
            >
              <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                <Dumbbell className="text-muted-foreground size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{exercise.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => unarchiveMutation.mutate(exercise.id)}
              >
                <Undo2 className="mr-1 size-4" />
                {t("exercise.unarchive.success")}
              </Button>
            </Card>
          ))}
        </div>
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
    </div>
  );
}
