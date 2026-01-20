"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Crown, Eye, MoreHorizontal, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserTableCell } from "../../_components/user-table-cell";
import type { UserWithStats } from "../_actions/admin-users";

type UserRowProps = {
  user: UserWithStats;
};

export const UserRow = ({ user }: UserRowProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();

  const onUserUpdate = () => {
    router.refresh();
  };

  // Ban user mutation
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
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.banFailed", { error: error.message }));
    },
  });

  // Unban user mutation
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
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.unbanFailed", { error: error.message }));
    },
  });

  // Impersonate user mutation
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
      // Refresh the page to update the session
      void queryClient.invalidateQueries();
      window.location.href = "/orgs";
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.impersonateFailed", { error: error.message }));
    },
  });

  // Set user role mutation
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
      onUserUpdate();
    },
    onError: (error: Error) => {
      toast.error(t("admin.users.roleUpdateFailed", { error: error.message }));
    },
  });

  return (
    <TableRow key={user.id}>
      <TableCell>
        <UserTableCell user={user} href={`/admin/users/${user.id}`} />
      </TableCell>
      <TableCell>
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {t(`admin.users.roles.${user.role ?? "user"}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {new Date(user.createdAt).toLocaleDateString(locale)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="user-row-menu-button"
              >
                <MoreHorizontal className="size-4" />
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
                  onClick={() => banUserMutation.mutate({ userId: user.id })}
                  disabled={banUserMutation.isPending}
                  variant="destructive"
                >
                  <Ban className="mr-2 size-4" />
                  {t("admin.users.actions.ban")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};
