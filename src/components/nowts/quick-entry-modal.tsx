"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useQuickEntryStore } from "@/features/mood/quick-entry-store";
import {
  createMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
} from "@/features/mood/mood.action";
import { MoodSlider } from "./mood-slider";
import { useI18n } from "@/i18n/provider";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { queueMoodEntry } from "@/features/pwa/offline-queue";

/**
 * QuickEntryModal - Fast mood entry modal (< 30 seconds)
 *
 * Features:
 * - MoodSlider for value selection (0-10)
 * - Optional note textarea
 * - Create or edit mode
 * - Delete with confirmation
 * - Smooth animations
 * - Close on backdrop click
 * - Accessible
 */
export function QuickEntryModal() {
  const { t } = useI18n();
  const { isOpen, editingEntry, close } = useQuickEntryStore();
  const [value, setValue] = useState(5);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();

  const isEditing = !!editingEntry;

  // Initialize form when editing
  useEffect(() => {
    if (editingEntry) {
      setValue(editingEntry.value);
      setNote(editingEntry.note ?? "");
    } else {
      setValue(5);
      setNote("");
    }
  }, [editingEntry]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingEntry) {
        const result = await updateMoodEntry({
          id: editingEntry.id,
          value,
          note: note.trim() || undefined,
        });
        if (result.serverError) {
          throw new Error(result.serverError);
        }
        return result.data;
      } else {
        const result = await createMoodEntry({
          value,
          note: note.trim() || undefined,
        });
        if (result.serverError) {
          throw new Error(result.serverError);
        }
        return result.data;
      }
    },
    onSuccess: () => {
      toast.success(
        isEditing ? t("mood.entry.updated") : t("mood.entry.saved"),
      );
      // Reset form
      setValue(5);
      setNote("");
      close();
      // Invalidate mood queries to refresh lists
      void queryClient.invalidateQueries({ queryKey: ["moodEntries"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async () => {
      if (!editingEntry) return;
      const result = await deleteMoodEntry({ id: editingEntry.id });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("mood.entry.deleted"));
      setValue(5);
      setNote("");
      close();
      void queryClient.invalidateQueries({ queryKey: ["moodEntries"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      if (isEditing) {
        toast.error("Modification hors ligne non disponible");
        return;
      }
      queueMoodEntry({ value, note: note.trim() || undefined });
      toast.success("Enregistrement hors ligne. Synchronisation automatique.");
      setValue(5);
      setNote("");
      close();
      void queryClient.invalidateQueries({ queryKey: ["moodEntries"] });
      return;
    }

    saveMutation.mutate();
  }, [
    close,
    isEditing,
    note,
    queryClient,
    saveMutation,
    value,
  ]);

  const handleDelete = useCallback(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast.error("Suppression hors ligne non disponible");
      return;
    }

    dialogManager.confirm({
      title: t("mood.entry.deleteTitle"),
      description: t("mood.entry.deleteDescription"),
      variant: "destructive",
      action: {
        label: t("mood.entry.deleteConfirm"),
        variant: "destructive",
        onClick: () => {
          deleteEntryMutation.mutate();
        },
      },
      cancel: {
        label: t("actions.cancel"),
      },
    });
  }, [deleteEntryMutation, t]);

  const handleClose = useCallback(() => {
    if (!saveMutation.isPending && !deleteEntryMutation.isPending) {
      close();
    }
  }, [close, saveMutation.isPending, deleteEntryMutation.isPending]);

  const isPending = saveMutation.isPending || deleteEntryMutation.isPending;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md",
          "bg-background/95 rounded-2xl p-6 shadow-xl backdrop-blur-lg",
          "border-border/50 border",
          "animate-in slide-in-from-bottom-4 fade-in-0 duration-300",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-entry-title"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id="quick-entry-title" className="text-xl font-semibold">
            {isEditing ? t("mood.entry.editTitle") : t("mood.entry.title")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isPending}
            className="size-8"
            aria-label={t("actions.close")}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Mood Slider */}
        <div className="mb-6">
          <MoodSlider value={value} onChange={setValue} disabled={isPending} />
        </div>

        {/* Optional Note */}
        <div className="mb-6">
          <Textarea
            placeholder={t("mood.entry.notePlaceholder")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isPending}
            className="min-h-[80px] resize-none"
            maxLength={500}
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {note.length}/500
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isEditing && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 size-4" />
              {t("mood.entry.delete")}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1"
            size="lg"
          >
            {isPending
              ? t("common.saving")
              : isEditing
                ? t("mood.entry.update")
                : t("mood.entry.save")}
          </Button>
        </div>
      </div>
    </>
  );
}
