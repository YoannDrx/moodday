"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pill, Plus, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { logPRNIntake } from "@/features/medication/medication.action";
import { useI18n } from "@/i18n/provider";

type PRNIntake = {
  id: string;
  takenAt: Date;
  note?: string | null;
};

type PRNMedicationCardProps = {
  medicationId: string;
  name: string;
  dosage: string;
  todayIntakes: PRNIntake[];
};

export function PRNMedicationCard({
  medicationId,
  name,
  dosage,
  todayIntakes,
}: PRNMedicationCardProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const logMutation = useMutation({
    mutationFn: async () => {
      const result = await logPRNIntake({
        medicationId,
        reason: reason || undefined,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.prn.logged"));
      setIsDialogOpen(false);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["prnMedications"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const todayCount = todayIntakes.length;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
          <Pill className="text-primary size-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            <Badge variant="outline" className="text-xs">
              {t("medication.prn.badge")}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{dosage}</p>
        </div>

        {/* Today count */}
        {todayCount > 0 && (
          <Badge variant="secondary" className="shrink-0">
            {t("medication.prn.takenToday", { count: todayCount })}
          </Badge>
        )}

        {/* Log button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 size-4" />
              {t("medication.prn.logButton")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("medication.prn.logTitle", { name })}
              </DialogTitle>
              <DialogDescription>
                {t("medication.prn.logDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder={t("medication.prn.reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={logMutation.isPending}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                onClick={() => logMutation.mutate()}
                disabled={logMutation.isPending}
              >
                {logMutation.isPending
                  ? t("common.saving")
                  : t("medication.prn.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's intakes history */}
      {todayCount > 0 && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-sm"
          >
            <span>{t("medication.prn.todayHistory")}</span>
            {showHistory ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-2">
              {todayIntakes.map((intake) => (
                <div
                  key={intake.id}
                  className={cn(
                    "bg-muted/50 flex items-start gap-2 rounded-md p-2 text-sm",
                  )}
                >
                  <Clock className="text-muted-foreground mt-0.5 size-3" />
                  <div className="flex-1">
                    <span className="text-muted-foreground">
                      {new Date(intake.takenAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {intake.note && (
                      <p className="text-muted-foreground mt-1">
                        {intake.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
