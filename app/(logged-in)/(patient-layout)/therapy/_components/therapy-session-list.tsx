"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BenefitRating } from "@/components/nowts/benefit-rating";
import {
  getTherapySessions,
  deleteTherapySession,
} from "@/features/therapy/therapy.action";
import { useI18n } from "@/i18n/provider";

export function TherapySessionList() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
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

  const sessions = data?.sessions ?? [];

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/therapy/new">
            <Plus className="mr-2 size-4" />
            {t("therapy.list.addNew")}
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <Card className="p-8 text-center">
          <Calendar className="text-muted-foreground mx-auto mb-4 size-12" />
          <p className="text-muted-foreground">{t("therapy.list.empty")}</p>
        </Card>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Calendar className="text-primary size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <time className="font-medium">
                      {new Date(session.date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    {session.benefitRating && (
                      <BenefitRating
                        value={session.benefitRating}
                        readonly
                        size="sm"
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                    {session.notes}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
