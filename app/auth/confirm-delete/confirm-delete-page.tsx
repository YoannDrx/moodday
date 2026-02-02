"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ConfirmDeletePage({
  token,
  callbackUrl = "/auth/goodbye",
}: {
  token?: string;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error(t("auth.confirmDelete.invalidToken"));
      }
      return unwrapSafePromise(
        authClient.deleteUser({
          token,
        }),
      );
    },
    onError: (error) => {
      setError(error.message);
      toast.error(error.message);
    },
    onSuccess: () => {
      router.push(callbackUrl);
    },
  });

  const handleConfirmDelete = () => {
    setIsLoading(true);
    confirmDeleteMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/settings?tab=privacy");
  };

  if (!token) {
    router.push("/settings?tab=privacy");
    return null;
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <Trash2 />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">
          {t("auth.confirmDelete.title")}
        </CardHeader>

        <CardDescription className="text-center">
          {t("auth.confirmDelete.description")}
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t pt-6">
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="flex w-full gap-4">
          <LoadingButton
            loading={isLoading || confirmDeleteMutation.isPending}
            variant="destructive"
            onClick={handleConfirmDelete}
            className="flex-1"
          >
            {t("auth.confirmDelete.confirm")}
          </LoadingButton>
          <Button variant="outline" onClick={handleCancel} className="flex-1">
            {t("actions.cancel")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
