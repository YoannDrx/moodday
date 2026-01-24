"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, MoreHorizontal, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  logMedIntake,
  skipMedIntake,
  deleteMedIntake,
} from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";

type MedCheckboxProps = {
  medicationId: string;
  name: string;
  dosage: string;
  intake?: {
    id: string;
    skipped: boolean;
    note?: string | null;
  } | null;
};

export function MedCheckbox({
  medicationId,
  name,
  dosage,
  intake,
}: MedCheckboxProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  const isTaken = intake && !intake.skipped;
  const isSkipped = intake?.skipped;

  const logMutation = useMutation({
    mutationFn: async () => {
      const result = await logMedIntake({ medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
      toast.success(t("medication.intake.logged"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      const result = await skipMedIntake({ medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.intake.skipped"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const undoMutation = useMutation({
    mutationFn: async () => {
      if (!intake) return;
      const result = await deleteMedIntake({ intakeId: intake.id });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.intake.undone"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      void queryClient.invalidateQueries({ queryKey: ["todayIntakes"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isPending =
    logMutation.isPending || skipMutation.isPending || undoMutation.isPending;

  const handleClick = () => {
    if (isPending) return;
    if (!intake) {
      logMutation.mutate();
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-all",
        isTaken && "border-green-500/50 bg-green-50 dark:bg-green-950/20",
        isSkipped && "border-muted bg-muted/50 opacity-60",
        !intake && "hover:border-primary/50 cursor-pointer hover:shadow-sm",
      )}
      onClick={handleClick}
      role={!intake ? "button" : undefined}
      tabIndex={!intake ? 0 : undefined}
      onKeyDown={(e) => {
        if (!intake && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Status indicator */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full transition-all",
          isTaken && "bg-green-500 text-white",
          isSkipped && "bg-muted-foreground/20 text-muted-foreground",
          !intake && "bg-muted",
          isAnimating && "scale-110",
        )}
      >
        {isTaken && <Check className="size-5" />}
        {isSkipped && <X className="size-4" />}
        {!intake && (
          <div className="bg-muted-foreground/30 size-4 rounded-full" />
        )}
      </div>

      {/* Medication info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-medium",
            isSkipped && "text-muted-foreground line-through",
          )}
        >
          {name}
        </p>
        <p className="text-muted-foreground text-sm">{dosage}</p>
      </div>

      {/* Actions */}
      {intake ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isPending}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => undoMutation.mutate()}>
              <Undo2 className="mr-2 size-4" />
              {t("medication.intake.undo")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => e.stopPropagation()}
              disabled={isPending}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                skipMutation.mutate();
              }}
            >
              <X className="mr-2 size-4" />
              {t("medication.intake.skip")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
