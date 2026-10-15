"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/provider";
import { authClient, useSession } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { useEffect, useId, useState, useTransition } from "react";

const RESEND_COOLDOWN_SECONDS = 60;

export function ResendVerificationForm() {
  const { t } = useI18n();
  const session = useSession();
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "failed">("idle");
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const sessionEmail = session.data?.user.email;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const resend = () =>
    startTransition(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email: sessionEmail ?? email,
        callbackURL: getCallbackUrl("/dashboard"),
      });
      setStatus(error ? "failed" : "sent");
      if (!error) setCooldown(RESEND_COOLDOWN_SECONDS);
    });

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        resend();
      }}
    >
      {sessionEmail ? null : (
        <div className="space-y-1.5">
          <Label htmlFor={inputId}>{t("auth.verify.resendLabel")}</Label>
          <Input
            id={inputId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
      )}
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={isPending || cooldown > 0}
      >
        {cooldown > 0
          ? t("auth.verify.resendCooldown", { seconds: cooldown })
          : t("auth.verify.resendSubmit")}
      </Button>
      {status === "sent" ? (
        <p role="status" className="text-muted-foreground text-sm">
          {t("auth.verify.resendSent")}
        </p>
      ) : null}
      {status === "failed" ? (
        <p role="alert" className="text-destructive text-sm">
          {t("auth.verify.resendFailed")}
        </p>
      ) : null}
    </form>
  );
}
