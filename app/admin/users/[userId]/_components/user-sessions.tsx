"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dialogManager } from "@/features/dialog-manager/dialog-manager";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

type UserSessionsProps = {
  userId: string;
};

export function UserSessions({ userId }: UserSessionsProps) {
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();

  // Fetch user sessions using useQuery
  const {
    data: sessionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-sessions", userId],
    queryFn: async () => {
      return unwrapSafePromise(
        authClient.admin.listUserSessions({
          userId,
        }),
      );
    },
  });

  const sessions = sessionsData?.sessions ?? [];

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionToken: string) => {
      return unwrapSafePromise(
        authClient.admin.revokeUserSession({
          sessionToken: sessionToken,
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.userDetails.sessions.revoked"));
      void queryClient.invalidateQueries({
        queryKey: ["user-sessions", userId],
      });
    },
    onError: (error: Error) => {
      toast.error(
        t("admin.userDetails.sessions.revokeFailed", { error: error.message }),
      );
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: async () => {
      return unwrapSafePromise(
        authClient.admin.revokeUserSessions({
          userId,
        }),
      );
    },
    onSuccess: () => {
      toast.success(t("admin.userDetails.sessions.revokedAll"));
      void queryClient.invalidateQueries({
        queryKey: ["user-sessions", userId],
      });
    },
    onError: (error: Error) => {
      toast.error(
        t("admin.userDetails.sessions.revokeAllFailed", {
          error: error.message,
        }),
      );
    },
  });

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="size-4" />;

    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="size-4" />;
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="size-4" />;
    }
    return <Monitor className="size-4" />;
  };

  const formatUserAgent = (userAgent?: string | null) => {
    if (!userAgent) return t("admin.userDetails.sessions.unknownDevice");

    // Extract browser and OS info
    const ua = userAgent;
    let browser = t("admin.userDetails.sessions.unknownBrowser");
    let os = t("admin.userDetails.sessions.unknownOs");

    // Detect browser
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    // Detect OS
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return t("admin.userDetails.sessions.deviceFormat", { browser, os });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("admin.userDetails.sessions.title")}</CardTitle>
            <CardDescription>
              {t("admin.userDetails.sessions.description")}
            </CardDescription>
          </div>
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                dialogManager.confirm({
                  title: t("admin.userDetails.sessions.revokeAllTitle"),
                  description: t(
                    "admin.userDetails.sessions.revokeAllDescription",
                  ),
                  action: {
                    label: t("admin.userDetails.sessions.revokeAllAction"),
                    onClick: async () => {
                      await revokeAllSessionsMutation.mutateAsync();
                    },
                  },
                });
              }}
              disabled={revokeAllSessionsMutation.isPending}
            >
              <TrashIcon className="mr-2 size-4" />
              {t("admin.userDetails.sessions.revokeAllAction")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin" />
            <span className="ml-2">
              {t("admin.userDetails.sessions.loading")}
            </span>
          </div>
        ) : error ? (
          <div className="text-destructive py-4 text-center">
            {t("admin.userDetails.sessions.loadFailed", {
              error: error.message,
            })}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-muted-foreground py-4 text-center">
            {t("admin.userDetails.sessions.empty")}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("admin.userDetails.sessions.table.device")}
                  </TableHead>
                  <TableHead>
                    {t("admin.userDetails.sessions.table.ip")}
                  </TableHead>
                  <TableHead>
                    {t("admin.userDetails.sessions.table.status")}
                  </TableHead>
                  <TableHead>
                    {t("admin.userDetails.sessions.table.created")}
                  </TableHead>
                  <TableHead>
                    {t("admin.userDetails.sessions.table.expires")}
                  </TableHead>
                  <TableHead className="w-[100px]">
                    {t("admin.userDetails.sessions.table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.userAgent)}
                        <div>
                          <div className="font-medium">
                            {formatUserAgent(session.userAgent)}
                          </div>
                          {session.userAgent && (
                            <div className="text-muted-foreground max-w-[200px] truncate text-xs">
                              {session.userAgent}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">
                        {session.ipAddress ??
                          t("admin.userDetails.sessions.unknownIp")}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1.5">
                          <span
                            className={`size-1.5 rounded-full ${
                              new Date(session.expiresAt) > new Date()
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                            aria-hidden="true"
                          />
                          {new Date(session.expiresAt) > new Date()
                            ? t("admin.userDetails.sessions.status.active")
                            : t("admin.userDetails.sessions.status.expired")}
                        </Badge>
                        {(
                          session as unknown as {
                            impersonatedBy: string | null;
                          }
                        ).impersonatedBy && (
                          <Badge variant="outline">
                            {t(
                              "admin.userDetails.sessions.status.impersonated",
                            )}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(session.createdAt).toLocaleDateString(locale)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(session.createdAt).toLocaleTimeString(locale)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(session.expiresAt).toLocaleDateString(locale)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(session.expiresAt).toLocaleTimeString(locale)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          revokeSessionMutation.mutate(session.token)
                        }
                        disabled={revokeSessionMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
