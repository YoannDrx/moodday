"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  deletePeriodAction,
  endPeriodAction,
  startPeriodAction,
} from "../couple.action";

const useRun = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return {
    isPending,
    run: (
      operation: () => Promise<{
        serverError?: string;
        validationErrors?: unknown;
      }>,
      success: string,
    ) =>
      startTransition(async () => {
        const result = await operation();
        if (result.serverError || result.validationErrors) {
          toast.error(result.serverError ?? "Ça n'a pas marché.");
          return;
        }
        toast.success(success);
        router.refresh();
      }),
  };
};

export function PeriodButtons({
  today,
  ongoing,
}: {
  today: string;
  ongoing: boolean;
}) {
  const { isPending, run } = useRun();
  return ongoing ? (
    <Button
      variant="mint"
      size="lg"
      disabled={isPending}
      onClick={() =>
        run(
          async () => endPeriodAction({ date: today }),
          "Noté : règles terminées.",
        )
      }
    >
      Mes règles sont finies
    </Button>
  ) : (
    <Button
      variant="honey"
      size="lg"
      disabled={isPending}
      onClick={() =>
        run(
          async () => startPeriodAction({ date: today }),
          "Noté. Prends soin de toi.",
        )
      }
    >
      Mes règles ont commencé
    </Button>
  );
}

export function DeletePeriodButton({
  periodId,
  label,
}: {
  periodId: string;
  label: string;
}) {
  const { isPending, run } = useRun();
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      onClick={() =>
        run(async () => deletePeriodAction({ periodId }), "Règles supprimées.")
      }
    >
      <Trash2 />
      <span className="sr-only">Supprimer {label}</span>
    </Button>
  );
}
