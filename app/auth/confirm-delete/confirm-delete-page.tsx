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
import { useSession } from "@/lib/auth-client";
import { purgeOfflineDataForOwner } from "@/features/pwa/offline-store";
import {
  purgeAuthenticatedBrowserCaches,
  unsubscribeCurrentPush,
} from "@/features/pwa/push-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const { data: session } = useSession();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDeleteMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error(t("auth.confirmDelete.invalidToken"));
      }
      const result = await unwrapSafePromise(
        authClient.deleteUser({
          token,
        }),
      );
      void unsubscribeCurrentPush().catch(() => undefined);
      if (session?.user.id) {
        await purgeOfflineDataForOwner(session.user.id).catch(() => undefined);
      }
      await purgeAuthenticatedBrowserCaches().catch(() => undefined);
      return result;
    },
    onError: (error) => {
      setIsLoading(false);
      setError(error.message);
      toast.error(error.message);
    },
    onSuccess: () => window.location.replace(callbackUrl),
  });

  useEffect(() => setIsHydrated(true), []);

  const handleConfirmDelete = () => {
    setIsLoading(true);
    confirmDeleteMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/settings/privacy");
  };

  if (!token) {
    router.push("/settings/privacy");
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
            disabled={
              !isHydrated || isLoading || confirmDeleteMutation.isPending
            }
            className="flex-1 disabled:bg-gray-100 disabled:text-gray-700 disabled:opacity-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-300"
          >
            {t("auth.confirmDelete.confirm")}
          </LoadingButton>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!isHydrated || confirmDeleteMutation.isPending}
            className="flex-1"
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
