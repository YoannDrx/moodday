"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Building2, UserX2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteAccountForm() {
  const { t } = useI18n();
  const deleteAccountMutation = useMutation({
    mutationFn: async () =>
      unwrapSafePromise(
        authClient.deleteUser({
          callbackURL: "/auth/goodbye",
        }),
      ),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5" />
          <CardTitle className="text-xl font-semibold">
            {t("account.danger.title")}
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground text-base">
          {t("account.danger.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <UserX2 className="text-muted-foreground mt-0.5 size-5" />
            <div className="space-y-1">
              <p className="leading-none font-medium">
                {t("account.danger.personalTitle")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("account.danger.personalDescription")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <Building2 className="text-muted-foreground mt-0.5 size-5" />
            <div className="space-y-1">
              <p className="leading-none font-medium">
                {t("account.danger.orgTitle")}
              </p>
              <p className="text-muted-foreground text-sm">
                {t("account.danger.orgDescription")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end border-t pt-4">
        <LoadingButton
          variant="destructive"
          size="lg"
          loading={deleteAccountMutation.isPending}
          onClick={() => {
            dialogManager.confirm({
              title: t("account.danger.confirmTitle"),
              description: t("account.danger.confirmDescription"),
              confirmText: t("account.danger.confirmText"),
              action: {
                label: t("account.danger.confirmText"),
                onClick: async () => {
                  await deleteAccountMutation.mutateAsync();
                  toast.success(t("account.danger.requestedTitle"), {
                    description: t("account.danger.requestedDescription"),
                  });
                },
              },
            });
          }}
        >
          {t("account.danger.delete")}
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
