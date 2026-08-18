"use client";

import { getAuthenticatorName } from "@better-auth/passkey";
import { KeyRound, Laptop, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";

type AccountSession = {
  id: string;
  token: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  userAgent?: string | null;
};

type AccountPasskey = {
  id: string;
  name?: string | null;
  aaguid?: string | null;
  deviceType: string;
  backedUp: boolean;
  createdAt?: Date | string | null;
};

const formatDevice = (userAgent?: string | null) => {
  if (!userAgent) return "Appareil inconnu";
  if (/iphone|ipad/i.test(userAgent)) return "Safari sur iPhone/iPad";
  if (/android/i.test(userAgent)) return "Navigateur Android";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/edg/i.test(userAgent)) return "Microsoft Edge";
  if (/chrome/i.test(userAgent)) return "Google Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  return "Navigateur web";
};

export function AccountSecurityControls({
  initialTwoFactorEnabled,
}: {
  initialTwoFactorEnabled: boolean;
}) {
  const { locale } = useI18n();
  const router = useRouter();
  const isFrench = locale === "fr";
  const { data: currentSession } = authClient.useSession();
  const [sessions, setSessions] = useState<AccountSession[]>([]);
  const [passkeys, setPasskeys] = useState<AccountPasskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    initialTwoFactorEnabled,
  );
  const [pending, setPending] = useState(false);

  const loadSecurityState = useCallback(async () => {
    setLoading(true);
    const [sessionResult, passkeyResult] = await Promise.all([
      authClient.listSessions(),
      authClient.passkey.listUserPasskeys(),
    ]);
    setSessions((sessionResult.data ?? []) as AccountSession[]);
    setPasskeys((passkeyResult.data ?? []) as AccountPasskey[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSecurityState();
  }, [loadSecurityState]);

  const addPasskey = async () => {
    setPending(true);
    const result = await authClient.passkey.addPasskey({
      name: isFrench ? "Clé Moodday" : "Moodday passkey",
    });
    setPending(false);
    if (result.error) {
      toast.error(
        isFrench
          ? "La passkey n’a pas pu être ajoutée. Réauthentifiez-vous puis réessayez."
          : "The passkey could not be added. Reauthenticate and try again.",
      );
      return;
    }
    toast.success(isFrench ? "Passkey ajoutée" : "Passkey added");
    await loadSecurityState();
  };

  const removePasskey = async (id: string) => {
    setPending(true);
    const result = await authClient.passkey.deletePasskey({ id });
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Suppression impossible" : "Unable to delete");
      return;
    }
    await loadSecurityState();
  };

  const beginTwoFactorEnrollment = async () => {
    setPending(true);
    const result = await authClient.twoFactor.enable({
      password: password.length > 0 ? password : undefined,
      issuer: "Moodday",
    });
    setPending(false);
    if (result.error) {
      toast.error(
        isFrench
          ? "Vérification du mot de passe impossible"
          : "Password verification failed",
      );
      return;
    }
    setTotpUri(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
  };

  const confirmTwoFactorEnrollment = async () => {
    setPending(true);
    const result = await authClient.twoFactor.verifyTotp({
      code: totpCode.trim(),
      trustDevice: false,
    });
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Code TOTP invalide" : "Invalid TOTP code");
      return;
    }
    setTwoFactorEnabled(true);
    setTotpUri(null);
    setPassword("");
    setTotpCode("");
    toast.success(isFrench ? "Double authentification activée" : "Two-factor authentication enabled");
  };

  const disableTwoFactor = async () => {
    setPending(true);
    const result = await authClient.twoFactor.disable({
      password: password.length > 0 ? password : undefined,
    });
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Désactivation impossible" : "Unable to disable");
      return;
    }
    setTwoFactorEnabled(false);
    setBackupCodes([]);
    setPassword("");
  };

  const regenerateBackupCodes = async () => {
    setPending(true);
    const result = await authClient.twoFactor.generateBackupCodes({
      password: password.length > 0 ? password : undefined,
    });
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Génération impossible" : "Unable to generate codes");
      return;
    }
    setBackupCodes(result.data.backupCodes);
  };

  const revokeSession = async (token: string) => {
    setPending(true);
    const result = await authClient.revokeSession({ token });
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Révocation impossible" : "Unable to revoke session");
      return;
    }
    await loadSecurityState();
  };

  const revokeOtherSessions = async () => {
    setPending(true);
    const result = await authClient.revokeOtherSessions();
    setPending(false);
    if (result.error) {
      toast.error(isFrench ? "Révocation impossible" : "Unable to revoke sessions");
      return;
    }
    await loadSecurityState();
  };

  const reauthenticateWithPassword = async () => {
    const email = currentSession?.user.email;
    if (!email || password.length === 0) return;
    setPending(true);
    const result = await authClient.signIn.email({
      email,
      password,
      rememberMe: true,
    });
    setPending(false);
    if (result.error) {
      toast.error(
        isFrench ? "Réauthentification impossible" : "Reauthentication failed",
      );
      return;
    }
    setPassword("");
    toast.success(
      isFrench
        ? "Identité confirmée pour dix minutes"
        : "Identity confirmed for ten minutes",
    );
    router.refresh();
  };

  const reauthenticateWithPasskey = async () => {
    setPending(true);
    const result = await authClient.signIn.passkey();
    setPending(false);
    if (result.error) {
      toast.error(
        isFrench ? "Réauthentification impossible" : "Reauthentication failed",
      );
      return;
    }
    toast.success(
      isFrench
        ? "Identité confirmée pour dix minutes"
        : "Identity confirmed for ten minutes",
    );
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <GlassCard padding="lg" variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle icon={<ShieldCheck className="size-5" />}>
            {isFrench ? "Confirmer votre identité" : "Confirm your identity"}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {isFrench
              ? "Les opérations sensibles exigent une connexion datant de moins de dix minutes."
              : "Sensitive operations require a sign-in less than ten minutes old."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="reauth-password">
              {isFrench ? "Mot de passe" : "Password"}
            </Label>
            <Input
              id="reauth-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={pending || password.length === 0}
              onClick={() => void reauthenticateWithPassword()}
            >
              {isFrench ? "Confirmer par mot de passe" : "Confirm with password"}
            </Button>
            <Button
              variant="outline"
              disabled={pending || passkeys.length === 0}
              onClick={() => void reauthenticateWithPasskey()}
            >
              {isFrench ? "Confirmer par passkey" : "Confirm with passkey"}
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard padding="lg" variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle icon={<Laptop className="size-5" />}>
            {isFrench ? "Sessions et appareils" : "Sessions and devices"}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">
              {isFrench ? "Chargement…" : "Loading…"}
            </p>
          ) : null}
          {sessions.map((session) => {
            const isCurrent = session.token === currentSession?.session.token;
            return (
              <div
                key={session.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{formatDevice(session.userAgent)}</p>
                  <p className="text-muted-foreground text-xs">
                    {new Date(session.updatedAt).toLocaleString(locale)}
                    {isCurrent
                      ? isFrench
                        ? " · session actuelle"
                        : " · current session"
                      : ""}
                  </p>
                </div>
                {!isCurrent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => void revokeSession(session.token)}
                  >
                    {isFrench ? "Révoquer" : "Revoke"}
                  </Button>
                ) : null}
              </div>
            );
          })}
          <Button
            variant="outline"
            disabled={pending || sessions.length < 2}
            onClick={() => void revokeOtherSessions()}
          >
            {isFrench
              ? "Déconnecter tous les autres appareils"
              : "Sign out all other devices"}
          </Button>
        </GlassCardContent>
      </GlassCard>

      <GlassCard padding="lg" variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle icon={<KeyRound className="size-5" />}>
            Passkeys
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-3">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {passkey.name ??
                    getAuthenticatorName(passkey.aaguid ?? undefined) ??
                    "Passkey"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {passkey.deviceType}
                  {passkey.backedUp ? " · sauvegardée" : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => void removePasskey(passkey.id)}
              >
                {isFrench ? "Supprimer" : "Delete"}
              </Button>
            </div>
          ))}
          <Button disabled={pending} onClick={() => void addPasskey()}>
            {isFrench ? "Ajouter une passkey" : "Add a passkey"}
          </Button>
        </GlassCardContent>
      </GlassCard>

      <GlassCard padding="lg" variant="elevated">
        <GlassCardHeader>
          <GlassCardTitle icon={<ShieldCheck className="size-5" />}>
            {isFrench ? "Double authentification (TOTP)" : "Two-factor authentication (TOTP)"}
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {twoFactorEnabled
              ? isFrench
                ? "La double authentification est active."
                : "Two-factor authentication is enabled."
              : isFrench
                ? "Utilisez une application d’authentification. Aucun SMS n’est utilisé."
                : "Use an authenticator app. SMS is never used."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="security-password">
              {isFrench
                ? "Mot de passe (si votre compte en possède un)"
                : "Password (if your account has one)"}
            </Label>
            <Input
              id="security-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {!twoFactorEnabled && !totpUri ? (
            <Button disabled={pending} onClick={() => void beginTwoFactorEnrollment()}>
              {isFrench ? "Configurer TOTP" : "Set up TOTP"}
            </Button>
          ) : null}

          {totpUri ? (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="w-fit rounded bg-white p-3">
                <QRCode value={totpUri} size={180} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totp-code">
                  {isFrench ? "Code à six chiffres" : "Six-digit code"}
                </Label>
                <Input
                  id="totp-code"
                  value={totpCode}
                  onChange={(event) => setTotpCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </div>
              <Button
                disabled={pending || totpCode.trim().length !== 6}
                onClick={() => void confirmTwoFactorEnrollment()}
              >
                {isFrench ? "Vérifier et activer" : "Verify and enable"}
              </Button>
            </div>
          ) : null}

          {twoFactorEnabled ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => void regenerateBackupCodes()}
              >
                {isFrench ? "Régénérer les codes de récupération" : "Regenerate recovery codes"}
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => void disableTwoFactor()}
              >
                {isFrench ? "Désactiver TOTP" : "Disable TOTP"}
              </Button>
            </div>
          ) : null}

          {backupCodes.length > 0 ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="mb-3 text-sm font-medium">
                {isFrench
                  ? "Enregistrez ces codes maintenant. Chacun est à usage unique."
                  : "Save these codes now. Each code can only be used once."}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <code key={code} className="rounded bg-background px-2 py-1 text-sm">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          ) : null}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
