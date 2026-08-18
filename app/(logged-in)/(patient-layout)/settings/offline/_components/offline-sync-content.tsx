"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CloudOff,
  CloudUpload,
  Download,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import {
  getQueuedActions,
  syncQueuedActions,
} from "@/features/pwa/offline-actions";
import {
  OFFLINE_QUEUE_CHANGED_EVENT,
  notifyOfflineQueueChanged,
} from "@/features/pwa/offline-events";
import {
  getQueuedMoodEntries,
  syncQueuedMoodEntries,
} from "@/features/pwa/offline-queue";
import {
  compactOfflineOperations,
  discardOfflineOperation,
  retryOfflineOperation,
  type OfflineOperation,
  type OfflineOperationStatus,
} from "@/features/pwa/offline-store";
import { buildOfflineDiagnostic } from "@/features/pwa/offline-diagnostic";

type SafeOperation = Pick<
  OfflineOperation,
  "id" | "kind" | "status" | "retryCount" | "createdAt"
> & { actionType?: string };

const statusStyles: Record<OfflineOperationStatus, string> = {
  pending: "bg-blue-50 text-blue-700",
  syncing: "bg-teal-50 text-teal-700",
  failed: "bg-amber-50 text-amber-800",
  conflict: "bg-red-50 text-red-700",
};

export function OfflineSyncContent({ ownerId }: { ownerId: string }) {
  const { locale, t } = useI18n();
  const [operations, setOperations] = useState<SafeOperation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadOperations = useCallback(async () => {
    try {
      await compactOfflineOperations(ownerId);
      const [actions, moods] = await Promise.all([
        getQueuedActions(ownerId),
        getQueuedMoodEntries(ownerId),
      ]);
      const safeActions = actions.map((operation) => ({
        id: operation.id,
        kind: operation.kind,
        status: operation.status,
        retryCount: operation.retryCount,
        createdAt: operation.createdAt,
        actionType: operation.payload.type,
      }));
      const safeMoods = moods.map((operation) => ({
        id: operation.id,
        kind: operation.kind,
        status: operation.status,
        retryCount: operation.retryCount,
        createdAt: operation.createdAt,
      }));
      setOperations(
        [...safeActions, ...safeMoods].sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt),
        ),
      );
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    updateConnection();
    void loadOperations();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    window.addEventListener(OFFLINE_QUEUE_CHANGED_EVENT, loadOperations);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener(OFFLINE_QUEUE_CHANGED_EVENT, loadOperations);
    };
  }, [loadOperations]);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const synchronize = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const [actions, moods] = await Promise.all([
        syncQueuedActions(ownerId),
        syncQueuedMoodEntries(ownerId),
      ]);
      await loadOperations();
      if (actions.remaining + moods.remaining === 0) {
        toast.success(t("settings.offline.syncComplete"));
      } else {
        toast.warning(t("settings.offline.syncIncomplete"));
      }
    } catch {
      toast.error(t("settings.offline.syncError"));
    } finally {
      setIsSyncing(false);
    }
  };

  const retry = async (id: string) => {
    await retryOfflineOperation(ownerId, id);
    notifyOfflineQueueChanged();
    toast.info(t("settings.offline.retryStarted"));
    await synchronize();
  };

  const discard = async (id: string) => {
    await discardOfflineOperation(ownerId, id);
    notifyOfflineQueueChanged();
    toast.success(t("settings.offline.discarded"));
  };

  const downloadDiagnostic = async () => {
    try {
      const storage = await navigator.storage.estimate();
      const diagnostic = buildOfflineDiagnostic({
        operations: operations.map((operation) => ({
          ...operation,
          payload: undefined,
          updatedAt: operation.createdAt,
        })),
        online: isOnline,
        storage,
      });
      const blob = new Blob([JSON.stringify(diagnostic, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moodday-offline-diagnostic-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("settings.offline.diagnosticReady"));
    } catch {
      toast.error(t("settings.offline.diagnosticError"));
    }
  };

  return (
    <PageLayout
      title={t("settings.offline.title")}
      subtitle={t("settings.offline.subtitle")}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-start gap-4 pt-6">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                isOnline
                  ? "bg-teal-50 text-teal-700"
                  : "bg-amber-50 text-amber-800",
              )}
            >
              {isOnline ? <CloudUpload /> : <CloudOff />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {t(
                  isOnline
                    ? "settings.offline.online"
                    : "settings.offline.offline",
                )}
              </p>
              <p className="text-muted-foreground text-sm">
                {t(
                  isOnline
                    ? "settings.offline.onlineDescription"
                    : "settings.offline.offlineDescription",
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>{t("settings.offline.pendingTitle")}</CardTitle>
                <CardDescription className="mt-2 flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  {t("settings.offline.privacyNotice")}
                </CardDescription>
              </div>
              {operations.length > 0 && (
                <Button
                  size="sm"
                  className="min-h-11"
                  onClick={() => void synchronize()}
                  disabled={!isOnline || isSyncing}
                >
                  <RefreshCw className={cn(isSyncing && "animate-spin")} />
                  {t("settings.offline.retryAll")}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div
                className="space-y-3"
                role="status"
                aria-busy="true"
                aria-label={t("settings.offline.loading")}
              >
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
                <AlertCircle className="mb-3 size-6" />
                <p className="font-semibold">
                  {t("settings.offline.loadErrorTitle")}
                </p>
                <p className="mt-1 text-sm">
                  {t("settings.offline.loadErrorDescription")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 min-h-11"
                  onClick={() => void loadOperations()}
                >
                  {t("settings.offline.retry")}
                </Button>
              </div>
            ) : operations.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-12 text-center">
                <CheckCircle2 className="mb-4 size-10 text-[var(--success)]" />
                <p className="font-semibold">
                  {t("settings.offline.emptyTitle")}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("settings.offline.emptyDescription")}
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {operations.map((operation) => {
                  const operationKey =
                    operation.kind === "mood"
                      ? "mood"
                      : (operation.actionType ?? "mood");
                  return (
                    <li
                      key={operation.id}
                      className="rounded-xl border bg-[var(--surface)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">
                            {t(`settings.offline.operation.${operationKey}`)}
                          </p>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {t("settings.offline.createdAt", {
                              date: dateFormatter.format(
                                new Date(operation.createdAt),
                              ),
                            })}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-semibold",
                            statusStyles[operation.status],
                          )}
                        >
                          {t(`settings.offline.status.${operation.status}`)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                        <span className="text-muted-foreground text-xs">
                          {t("settings.offline.attempts", {
                            count: operation.retryCount,
                          })}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            disabled={!isOnline || isSyncing}
                            onClick={() => void retry(operation.id)}
                          >
                            <RefreshCw />
                            {t("settings.offline.retry")}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-11"
                              >
                                <Trash2 />
                                {t("settings.offline.discard")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("settings.offline.discardTitle")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("settings.offline.discardDescription")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("settings.offline.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                  onClick={() => void discard(operation.id)}
                                >
                                  {t("settings.offline.confirmDiscard")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.offline.diagnosticTitle")}</CardTitle>
            <CardDescription>
              {t("settings.offline.diagnosticDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => void downloadDiagnostic()}
            >
              <Download />
              {t("settings.offline.downloadDiagnostic")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
