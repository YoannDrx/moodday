"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/i18n/provider";
import { useSession } from "@/lib/auth-client";
import {
  countOfflineOperations,
  mayHaveOfflineOperations,
  purgeOfflineDataForOwner,
  setActiveOfflineOwner,
} from "@/features/pwa/offline-store";
import {
  purgeAuthenticatedBrowserCaches,
  unsubscribeCurrentPush,
} from "@/features/pwa/push-client";
import { useRef, useState } from "react";
import { toast } from "sonner";

export function useProtectedSignOut() {
  const { data: session, isPending: isSessionPending } = useSession();
  const { locale } = useI18n();
  const ownerId = session?.user.id;
  const [pendingCount, setPendingCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const logoutFormRef = useRef<HTMLFormElement>(null);
  const isEnglish = locale === "en";

  const completeSignOut = async (purgeOffline: boolean) => {
    setIsPending(true);
    try {
      if (ownerId) {
        void unsubscribeCurrentPush().catch(() => undefined);
        if (purgeOffline) await purgeOfflineDataForOwner(ownerId);
      }
      setActiveOfflineOwner();
      void purgeAuthenticatedBrowserCaches().catch(() => undefined);
      const pushDeviceId = window.localStorage.getItem(
        "moodday.push.device-id",
      );
      const logoutPath = pushDeviceId
        ? `/api/auth/logout?deviceId=${encodeURIComponent(pushDeviceId)}`
        : "/api/auth/logout";
      const form = logoutFormRef.current;
      if (!form) throw new Error("logout_form_unavailable");
      form.action = logoutPath;
      form.requestSubmit();
    } catch {
      toast.error(
        isEnglish
          ? "Sign-out could not be completed. Your offline data was not shared."
          : "La déconnexion n’a pas pu aboutir. Vos données hors ligne n’ont pas été partagées.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const requestSignOut = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const count =
        ownerId && mayHaveOfflineOperations(ownerId)
          ? await countOfflineOperations(ownerId)
          : 0;
      if (count > 0) {
        setPendingCount(count);
        setDialogOpen(true);
        return;
      }
      await completeSignOut(false);
    } catch {
      toast.error(
        isEnglish
          ? "Unable to verify the offline queue. Sign-out was cancelled."
          : "Impossible de vérifier la file hors ligne. La déconnexion est annulée.",
      );
    } finally {
      setIsPending(false);
    }
  };

  const dialog = (
    <>
      <form ref={logoutFormRef} method="POST" hidden>
        <input type="hidden" name="intent" value="sign-out" />
      </form>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEnglish
                ? "Unsynchronized data"
                : "Données non synchronisées"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEnglish
                ? `${pendingCount} item(s) are still stored securely on this device. Stay signed in to synchronize them, or delete them before signing out.`
                : `${pendingCount} élément(s) sont encore conservés de façon sécurisée sur cet appareil. Restez connecté pour les synchroniser, ou supprimez-les avant de vous déconnecter.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {isEnglish ? "Stay signed in" : "Rester connecté"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                void completeSignOut(true);
              }}
            >
              {isEnglish
                ? "Delete and sign out"
                : "Supprimer et se déconnecter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return {
    requestSignOut,
    dialog,
    isPending,
    canSignOut: Boolean(ownerId) && !isSessionPending,
  };
}
