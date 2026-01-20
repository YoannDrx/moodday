"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Crown, Eye, MoreHorizontal, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

type UserActionsProps = {
  user: User;
};

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const impersonateMutation = useMutation({
    mutationFn: async (userId: string) => {
      return unwrapSafePromise(
        authClient.admin.impersonateUser({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.users.impersonating"));
      void queryClient.invalidateQueries();
      window.location.href = "/orgs";
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.impersonateFailed", { error: error.message }));
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => {
      return unwrapSafePromise(
        authClient.admin.banUser({
          userId,
          banReason: reason ?? t("admin.users.banReason"),
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.users.banned"));
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.banFailed", { error: error.message }));
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return unwrapSafePromise(
        authClient.admin.unbanUser({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.users.unbanned"));
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.unbanFailed", { error: error.message }));
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
    }) => {
      return unwrapSafePromise(
        authClient.admin.setRole({
          userId,
          role,
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.users.roleUpdated"));
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.roleUpdateFailed", { error: error.message }));
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <MoreHorizontal className="mr-2 size-4" />
          {t("admin.users.table.actions")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!user.banned && (
          <DropdownMenuItem
            onClick={() => impersonateMutation.mutate(user.id)}
            disabled={impersonateMutation.isPending}
          >
            <Eye className="mr-2 size-4" />
            {t("admin.users.actions.impersonate")}
          </DropdownMenuItem>
        )}

        {user.role !== "admin" && (
          <DropdownMenuItem
            onClick={() =>
              setRoleMutation.mutate({
                userId: user.id,
                role: "admin" as const,
              })
            }
            disabled={setRoleMutation.isPending}
          >
            <Crown className="mr-2 size-4" />
            {t("admin.users.actions.makeAdmin")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {user.banned ? (
          <DropdownMenuItem
            onClick={() => unbanUserMutation.mutate(user.id)}
            disabled={unbanUserMutation.isPending}
          >
            <UserCheck className="mr-2 size-4" />
            {t("admin.users.actions.unban")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => {
              dialogManager.confirm({
                title: t("admin.users.actions.ban"),
                description: t("admin.users.banConfirm", {
                  name: user.name || user.email,
                }),
                action: {
                  label: t("admin.users.actions.ban"),
                  onClick: async () => {
                    await banUserMutation.mutateAsync({ userId: user.id });
                  },
                },
              });
            }}
            disabled={banUserMutation.isPending}
            className="text-destructive focus:text-destructive"
          >
            <Ban className="mr-2 size-4" />
            {t("admin.users.actions.ban")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
