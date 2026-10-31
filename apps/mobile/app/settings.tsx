import type { EntitlementDto } from "@moodday/contracts";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { Bouyotte } from "../src/components/bouyotte";
import { Screen } from "../src/components/screen";
import { Button, Card, StatusText, ToggleRow, Txt } from "../src/components/ui";
import {
  exportAndShareAccountData,
  MobileAccountDataError,
} from "../src/lib/account-data";
import { api, appBaseUrl } from "../src/lib/api";
import { authClient } from "../src/lib/auth-client";
import {
  ensurePushRegistration,
  getPushPermission,
  isPushOptedOut,
  unregisterPush,
  type PushPermission,
} from "../src/lib/notifications";
import { countOfflineCheckIns } from "../src/lib/offline-queue";
import {
  isMobileBillingAvailable,
  presentDuoPaywall,
  restoreDuoPurchases,
  showMobileSubscriptionManagement,
} from "../src/lib/purchases";
import { signOutOfMoodday } from "../src/lib/sign-out";
import { useTodayState } from "../src/lib/today-store";

export default function SettingsScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const ownerId = session?.user.id;
  const { today } = useTodayState();
  const [pending, setPending] = useState(false);
  const [permission, setPermission] = useState<PushPermission>();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>();
  const [entitlement, setEntitlement] = useState<EntitlementDto>();
  const [billingStatus, setBillingStatus] = useState<string>();
  const [dataStatus, setDataStatus] = useState<string>();
  const [accountStatus, setAccountStatus] = useState<string>();

  useEffect(() => {
    void Promise.all([getPushPermission(), isPushOptedOut()])
      .then(([value, optedOut]) => {
        setPermission(value);
        setPushEnabled(value === "granted" && !optedOut);
      })
      .catch(() => setPushStatus("L’état des notifications est indisponible."));
  }, []);

  const refreshEntitlement = useCallback(async () => {
    try {
      setEntitlement(await api.getEntitlements());
    } catch {
      setBillingStatus("Le statut Duo est temporairement indisponible.");
    }
  }, []);

  useEffect(() => {
    if (ownerId) void refreshEntitlement();
  }, [ownerId, refreshEntitlement]);

  const togglePush = async (enable: boolean) => {
    setPending(true);
    setPushStatus(undefined);
    try {
      if (enable) {
        const result = await ensurePushRegistration({ prompt: true });
        setPermission(result);
        setPushEnabled(result === "granted");
        setPushStatus(
          result === "granted"
            ? "Notifications activées sur ce téléphone."
            : "Les notifications sont refusées dans les réglages du téléphone. Moodday marche quand même très bien.",
        );
      } else {
        await unregisterPush({ optOut: true });
        setPushEnabled(false);
        setPushStatus(
          "Ce téléphone ne recevra plus de notifications de ton duo.",
        );
      }
    } catch {
      setPushStatus(
        "Le réglage n’a pas pu être appliqué. Vérifie ta connexion puis réessaie.",
      );
    } finally {
      setPending(false);
    }
  };

  const runBilling = async (
    action: (userId: string) => Promise<EntitlementDto | undefined>,
    message: string,
  ) => {
    if (!ownerId) return;
    setPending(true);
    setBillingStatus(message);
    try {
      const result = await action(ownerId);
      if (result) setEntitlement(result);
      else await refreshEntitlement();
      setBillingStatus("Ton statut Duo est à jour, pour vous deux.");
    } catch {
      setBillingStatus(
        "L’opération n’a pas abouti. Aucun achat n’a été appliqué deux fois ; tu peux réessayer.",
      );
    } finally {
      setPending(false);
    }
  };

  const exportData = async () => {
    setPending(true);
    setDataStatus("Préparation de ton export complet…");
    try {
      await exportAndShareAccountData();
      setDataStatus(
        "L’export a été remis à l’app que tu as choisie, puis sa copie temporaire a été effacée.",
      );
    } catch (error) {
      setDataStatus(
        error instanceof MobileAccountDataError &&
          error.code === "recent_authentication_required"
          ? "Pour protéger tes données, reconnecte-toi puis relance l’export dans les dix minutes."
          : "L’export n’a pas abouti. Aucune copie temporaire n’a été conservée.",
      );
    } finally {
      setPending(false);
    }
  };

  const requestDeletion = () =>
    Alert.alert(
      "Demander la suppression du compte ?",
      "Moodday enverra un lien de confirmation à ton adresse e-mail. Après confirmation, le compte, ton duo et vos données seront définitivement supprimés, sous réserve des obligations légales de conservation.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer le lien",
          style: "destructive",
          onPress: () => {
            setPending(true);
            setDataStatus("Envoi du lien de confirmation…");
            void authClient
              .deleteUser({ callbackURL: `${appBaseUrl}/auth/goodbye` })
              .then((result) => {
                if (result.error) throw new Error("delete_request_failed");
                setDataStatus(
                  "Lien envoyé. Le compte ne sera supprimé qu’après ta confirmation par e-mail.",
                );
              })
              .catch(() =>
                setDataStatus(
                  "La demande n’a pas abouti. Ton compte et tes données restent inchangés.",
                ),
              )
              .finally(() => setPending(false));
          },
        },
      ],
    );

  const finishSignOut = async (discardOffline: boolean) => {
    if (!ownerId) return;
    setPending(true);
    setAccountStatus(undefined);
    try {
      await signOutOfMoodday(ownerId, { discardOffline });
      router.replace("/sign-in");
    } catch {
      setAccountStatus("Déconnexion impossible pour le moment. Réessaie.");
    } finally {
      setPending(false);
    }
  };

  const requestSignOut = async () => {
    if (!ownerId) return;
    const waiting = await countOfflineCheckIns(ownerId).catch(() => 0);
    if (waiting === 0) {
      void finishSignOut(false);
      return;
    }
    Alert.alert(
      "Un point attend encore le réseau",
      "Si tu te déconnectes maintenant, le point fait hors ligne sera effacé de ce téléphone sans être envoyé.",
      [
        { text: "Rester connecté·e", style: "cancel" },
        {
          text: "Effacer et me déconnecter",
          style: "destructive",
          onPress: () => void finishSignOut(true),
        },
      ],
    );
  };

  const openWeb = (path: string) => {
    void WebBrowser.openBrowserAsync(`${appBaseUrl}${path}`).catch(() =>
      setAccountStatus("Le lien ne peut pas s’ouvrir pour le moment."),
    );
  };

  const validUntil = entitlement?.validUntil
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
        new Date(entitlement.validUntil),
      )
    : null;

  return (
    <Screen
      title="Réglages"
      subtitle={session?.user.email}
      leading={
        <Button
          compact
          variant="outline"
          label="Fermer"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
      }
    >
      <Card title="Profil">
        <Txt>
          {today?.displayName ?? session?.user.name ?? "Toi"}
          {today?.role
            ? today.role === "cycle_owner"
              ? " · c’est ton cycle"
              : " · partenaire allié·e"
            : ""}
        </Txt>
        <Button
          variant="outline"
          label="Modifier mon profil sur le web"
          trailing="↗"
          onPress={() => openWeb("/settings/profile")}
        />
      </Card>

      <Card title="Notifications">
        <ToggleRow
          label="Nouvelles de mon duo"
          hint="Son point du jour, un geste, un merci. Rien la nuit, et des aperçus discrets sauf si elle choisit les notifications détaillées."
          value={pushEnabled}
          disabled={pending}
          onValueChange={(value) => void togglePush(value)}
        />
        {permission === "denied" ? (
          <Button
            variant="outline"
            label="Ouvrir les réglages du téléphone"
            onPress={() => void Linking.openSettings()}
          />
        ) : null}
        <StatusText>{pushStatus}</StatusText>
      </Card>

      {isMobileBillingAvailable() ? (
        <Card fill="honey" title="Moodday Duo">
          <Txt>
            {entitlement?.active
              ? validUntil
                ? `Duo actif jusqu’au ${validUntil}, pour vous deux.`
                : "Duo actif, pour vous deux."
              : "Un seul abonnement pour le couple. Le bouton « Besoin d’aide » reste toujours gratuit."}
          </Txt>
          {entitlement?.active ? (
            <Button
              variant="outline"
              label="Gérer mon abonnement"
              disabled={pending}
              onPress={() =>
                void runBilling(
                  showMobileSubscriptionManagement,
                  "Ouverture de la gestion de l’abonnement…",
                )
              }
            />
          ) : (
            <Button
              variant="primary"
              label="Découvrir Duo"
              disabled={pending}
              onPress={() =>
                void runBilling(presentDuoPaywall, "Ouverture de l’offre Duo…")
              }
            />
          )}
          <Button
            variant="ghost"
            label="Restaurer mes achats"
            disabled={pending}
            onPress={() =>
              void runBilling(restoreDuoPurchases, "Restauration des achats…")
            }
          />
          <StatusText>{billingStatus}</StatusText>
        </Card>
      ) : null}

      <Card title="Tes données">
        <Txt variant="small" tone="muted">
          Tes points, ton cycle et ta note privée t’appartiennent. Tu peux les
          récupérer ou tout effacer quand tu veux.
        </Txt>
        <Button
          variant="outline"
          label="Exporter mes données (JSON)"
          disabled={pending}
          onPress={() => void exportData()}
        />
        <Button
          variant="danger"
          label="Supprimer mon compte"
          disabled={pending}
          onPress={requestDeletion}
        />
        <StatusText>{dataStatus}</StatusText>
      </Card>

      <Card title="Aide et infos">
        <Button
          variant="danger"
          label="Besoin d’aide : 3114, 15, 112, 114"
          onPress={() => router.push("/help")}
        />
        <Button
          variant="ghost"
          label="Conditions d’utilisation"
          onPress={() => openWeb("/legal/terms")}
        />
        <Button
          variant="ghost"
          label="Confidentialité"
          onPress={() => openWeb("/legal/privacy")}
        />
        <Button
          variant="ghost"
          label="Contacter le support"
          onPress={() => openWeb("/contact")}
        />
      </Card>

      <Bouyotte mood="sleepy" size={72} />
      <Button
        variant="primary"
        label="Me déconnecter"
        pending={pending}
        onPress={() => void requestSignOut()}
      />
      <StatusText tone="danger">{accountStatus}</StatusText>
      <Txt variant="small" tone="muted">
        Moodday est un outil personnel non médical : il ne pose aucun
        diagnostic.
      </Txt>
    </Screen>
  );
}
