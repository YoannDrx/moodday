"use client";

import type {
  ApiError,
  CalendarConflictDto,
  CalendarConnectionDto,
} from "@moodday/contracts";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CloudOff,
  Link2,
  Pause,
  RefreshCw,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "@/components/nowts/page-layout";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";

const readResponse = async <T,>(response: Response): Promise<T> => {
  const body = (await response.json()) as
    | { data: T; requestId: string }
    | ApiError;
  if (!response.ok || !("data" in body)) {
    throw new Error(
      "error" in body ? body.error.code : "unexpected_calendar_response",
    );
  }
  return body.data;
};

const formatDate = (value: string | null, locale: string) =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

export function CalendarConnectionsContent({
  googleCalendarAvailable,
}: {
  googleCalendarAvailable: boolean;
}) {
  const { t, locale } = useI18n();
  const [connections, setConnections] = useState<CalendarConnectionDto[]>([]);
  const [conflicts, setConflicts] = useState<CalendarConflictDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const callbackHandled = useRef(false);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const nextConnections = await readResponse<CalendarConnectionDto[]>(
        await fetch("/api/v2/calendar-connections", { cache: "no-store" }),
      );
      setConnections(nextConnections);
      const active = nextConnections.find(
        (connection) =>
          connection.provider === "google" && connection.status !== "revoked",
      );
      setConflicts(
        active
          ? await readResponse<CalendarConflictDto[]>(
              await fetch(
                `/api/v2/calendar-connections/${encodeURIComponent(active.id)}/conflicts`,
                { cache: "no-store" },
              ),
            )
          : [],
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "calendar_load_failed",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const completeGoogleConnection = useCallback(async () => {
    setBusy("connect");
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const connection = await readResponse<CalendarConnectionDto>(
        await fetch("/api/v2/calendar-connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operationId: crypto.randomUUID(),
            connectionId: crypto.randomUUID(),
            sourceConnectionId: crypto.randomUUID(),
            timezone,
            displayName: "Mood Day",
            detailLevel: "generic",
          }),
        }),
      );
      await readResponse(
        await fetch(
          `/api/v2/calendar-connections/${encodeURIComponent(connection.id)}/sync`,
          { method: "POST" },
        ),
      );
      toast.success(t("settings.connections.connectedToast"));
      await load();
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "calendar_connection_failed",
      );
      toast.error(t("settings.connections.errorToast"));
    } finally {
      setBusy(null);
      window.history.replaceState({}, "", "/settings/connections");
    }
  }, [load, t]);

  useEffect(() => {
    if (callbackHandled.current) return;
    const callback = new URLSearchParams(window.location.search).get("calendar");
    if (callback !== "linked") return;
    callbackHandled.current = true;
    void completeGoogleConnection();
  }, [completeGoogleConnection]);

  const authorizeGoogle = async () => {
    if (!googleCalendarAvailable || !isOnline) return;
    setBusy("authorize");
    setError(null);
    const result = await authClient.linkSocial({
      provider: "google",
      callbackURL: `${window.location.origin}/settings/connections?calendar=linked`,
      scopes: [GOOGLE_CALENDAR_SCOPE],
    });
    if (result.error) {
      setBusy(null);
      setError(result.error.code ?? "google_authorization_failed");
      toast.error(t("settings.connections.errorToast"));
    }
  };

  const updateConnection = async (
    connection: CalendarConnectionDto,
    update: { status?: "active" | "paused"; detailLevel?: "generic" | "appointment" },
  ) => {
    setBusy(`update:${connection.id}`);
    try {
      await readResponse(
        await fetch(
          `/api/v2/calendar-connections/${encodeURIComponent(connection.id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          },
        ),
      );
      await load();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "calendar_update_failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const synchronize = async (connection: CalendarConnectionDto) => {
    setBusy(`sync:${connection.id}`);
    setError(null);
    try {
      await readResponse(
        await fetch(
          `/api/v2/calendar-connections/${encodeURIComponent(connection.id)}/sync`,
          { method: "POST" },
        ),
      );
      toast.success(t("settings.connections.syncedToast"));
      await load();
    } catch (syncError) {
      setError(
        syncError instanceof Error ? syncError.message : "calendar_sync_failed",
      );
      toast.error(t("settings.connections.errorToast"));
    } finally {
      setBusy(null);
    }
  };

  const revoke = async (connection: CalendarConnectionDto) => {
    setBusy(`revoke:${connection.id}`);
    try {
      await readResponse(
        await fetch(
          `/api/v2/calendar-connections/${encodeURIComponent(connection.id)}`,
          { method: "DELETE" },
        ),
      );
      toast.success(t("settings.connections.revokedToast"));
      await load();
    } catch (revokeError) {
      setError(
        revokeError instanceof Error ? revokeError.message : "calendar_revoke_failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const resolveConflict = async (
    conflict: CalendarConflictDto,
    resolution: "moodday" | "google",
  ) => {
    setBusy(`conflict:${conflict.id}`);
    try {
      await readResponse(
        await fetch(
          `/api/v2/calendar-connections/${encodeURIComponent(conflict.connectionId)}/conflicts/${encodeURIComponent(conflict.id)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resolution }),
          },
        ),
      );
      await load();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "calendar_conflict_failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const connection = connections.find(
    (item) => item.provider === "google" && item.status !== "revoked",
  );
  const errorMessage = error
    ? error.includes("authorization") ||
      error.includes("reauthorization") ||
      error.includes("recent_consent")
      ? t("settings.connections.authorizationError")
      : error.includes("disabled_by_flag") ||
          error.includes("incomplete_configuration")
        ? t("settings.connections.unavailableError")
        : t("settings.connections.genericError")
    : null;

  return (
    <PageLayout
      title={t("settings.connections.title")}
      subtitle={t("settings.connections.subtitle")}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {!isOnline && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <CloudOff className="size-5 shrink-0" />
            <p className="text-sm">{t("settings.connections.offline")}</p>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader className="bg-[linear-gradient(135deg,var(--color-muted),transparent)]">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays />
              </div>
              <div>
                <CardTitle>{t("settings.connections.googleTitle")}</CardTitle>
                <CardDescription className="mt-1">
                  {t("settings.connections.googleDescription")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {loading ? (
              <div role="status" aria-label={t("settings.connections.loading")}>
                <Skeleton className="h-32 w-full" />
              </div>
            ) : connection ? (
              <>
                <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-background/70 p-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    {connection.status === "active" ? (
                      <CheckCircle2 className="mt-0.5 size-5 text-teal-700" />
                    ) : (
                      <Pause className="mt-0.5 size-5 text-amber-700" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {connection.status === "active"
                          ? t("settings.connections.active")
                          : t("settings.connections.paused")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.connections.lastSync", {
                          date: formatDate(
                            connection.lastSyncCompletedAt,
                            locale === "fr" ? "fr-FR" : "en-GB",
                          ),
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={
                      !isOnline ||
                      connection.status !== "active" ||
                      busy !== null
                    }
                    onClick={() => void synchronize(connection)}
                  >
                    <RefreshCw
                      className={cn(
                        busy === `sync:${connection.id}` && "animate-spin",
                      )}
                    />
                    {t("settings.connections.syncNow")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendar-detail-level">
                    {t("settings.connections.detailLabel")}
                  </Label>
                  <select
                    id="calendar-detail-level"
                    className="min-h-12 w-full rounded-xl border bg-background px-3 text-sm"
                    value={connection.detailLevel}
                    disabled={busy !== null}
                    onChange={(event) =>
                      void updateConnection(connection, {
                        detailLevel: event.target.value as
                          | "generic"
                          | "appointment",
                      })
                    }
                  >
                    <option value="generic">
                      {t("settings.connections.detailGeneric")}
                    </option>
                    <option value="appointment">
                      {t("settings.connections.detailAppointment")}
                    </option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    {connection.detailLevel === "generic"
                      ? t("settings.connections.detailGenericHelp")
                      : t("settings.connections.detailAppointmentHelp")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="min-h-11"
                    disabled={busy !== null}
                    onClick={() =>
                      void updateConnection(connection, {
                        status:
                          connection.status === "paused" ? "active" : "paused",
                      })
                    }
                  >
                    {connection.status === "paused" ? <Link2 /> : <Pause />}
                    {connection.status === "paused"
                      ? t("settings.connections.resume")
                      : t("settings.connections.pause")}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="min-h-11"
                        disabled={busy !== null}
                      >
                        <Unlink />
                        {t("settings.connections.disconnect")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("settings.connections.disconnectTitle")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("settings.connections.disconnectDescription")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("common.cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void revoke(connection)}
                        >
                          {t("settings.connections.disconnect")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl border bg-muted/30 p-4">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" />
                  <p className="text-sm text-muted-foreground">
                    {t("settings.connections.scopeNotice")}
                  </p>
                </div>
                <Button
                  className="min-h-12 w-full sm:w-auto"
                  disabled={
                    !googleCalendarAvailable || !isOnline || busy !== null
                  }
                  onClick={() => void authorizeGoogle()}
                >
                  <Link2 />
                  {googleCalendarAvailable
                    ? t("settings.connections.connect")
                    : t("settings.connections.unavailable")}
                </Button>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950"
              >
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-semibold">
                    {t("settings.connections.errorTitle")}
                  </p>
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {conflicts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.connections.conflictsTitle")}</CardTitle>
              <CardDescription>
                {t("settings.connections.conflictsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Mood Day
                      </p>
                      <p className="font-medium">
                        {conflict.moodDay?.title ?? "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          conflict.moodDay?.startsAt ?? null,
                          locale === "fr" ? "fr-FR" : "en-GB",
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Google Agenda
                      </p>
                      <p className="font-medium">
                        {conflict.google?.deletedAt
                          ? t("settings.connections.deletedInGoogle")
                          : (conflict.google?.title ?? "—")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(
                          conflict.google?.startsAt ?? null,
                          locale === "fr" ? "fr-FR" : "en-GB",
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      className="min-h-11"
                      disabled={busy !== null}
                      onClick={() =>
                        void resolveConflict(conflict, "moodday")
                      }
                    >
                      {t("settings.connections.keepMoodDay")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11"
                      disabled={busy !== null}
                      onClick={() => void resolveConflict(conflict, "google")}
                    >
                      {t("settings.connections.keepGoogle")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
