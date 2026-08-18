"use client";

import { Lock } from "lucide-react";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { useI18n } from "@/i18n/provider";
import { ChangeEmailForm } from "@app/(logged-in)/(account-layout)/account/change-email/change-email-form";
import { ChangePasswordForm } from "@app/(logged-in)/(account-layout)/account/change-password/change-password-form";
import { AccountSecurityControls } from "./account-security-controls";
import { AccountSignOutButton } from "@app/(logged-in)/(account-layout)/account/account-sign-out-button";

export function SecurityContent({
  twoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  const { t } = useI18n();

  return (
    <PageLayout
      title={t("settings.tabs.security")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Lock className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.tabs.security")}
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="text-sm text-gray-500">
            {t("settings.security.description")}
          </GlassCardContent>
        </GlassCard>

        <ChangeEmailForm />
        <ChangePasswordForm />
        <AccountSecurityControls initialTwoFactorEnabled={twoFactorEnabled} />
        <AccountSignOutButton label={t("auth.logout")} />
      </div>
    </PageLayout>
  );
}
