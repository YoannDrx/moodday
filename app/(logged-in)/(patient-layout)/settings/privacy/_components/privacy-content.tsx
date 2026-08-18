"use client";

import Link from "next/link";
import {
  Shield,
  Download,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { useI18n } from "@/i18n/provider";
import { DeleteAccountForm } from "@app/(logged-in)/(account-layout)/account/danger/delete-account-form";
import { Switch } from "@/components/ui/switch";
import { setAiInsightsConsent } from "@/features/insights/ai-insight.action";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { useMutation } from "@tanstack/react-query";

export function PrivacyContent({
  initialAiEnabled,
  initialJournalNotesEnabled,
  aiAvailable,
  importAvailable,
}: {
  initialAiEnabled: boolean;
  initialJournalNotesEnabled: boolean;
  aiAvailable: boolean;
  importAvailable: boolean;
}) {
  const { t } = useI18n();
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled);
  const [journalNotesEnabled, setJournalNotesEnabled] = useState(
    initialJournalNotesEnabled,
  );
  const consentMutation = useMutation({
    mutationFn: async (next: {
      enabled: boolean;
      includeJournalNotes: boolean;
    }) => resolveActionResult(setAiInsightsConsent(next)),
    onSuccess: (_, next) => {
      setAiEnabled(next.enabled);
      setJournalNotesEnabled(next.enabled && next.includeJournalNotes);
      toast.success(t("settings.privacy.aiSaved"));
    },
    onError: () => toast.error(t("settings.privacy.aiSaveError")),
  });

  return (
    <PageLayout
      title={t("settings.privacy.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {aiAvailable ? (
          <GlassCard padding="lg" variant="elevated">
            <GlassCardHeader>
              <GlassCardTitle
                icon={<Sparkles className="size-5 text-[var(--primary)]" />}
              >
                {t("settings.privacy.aiTitle")}
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-5">
              <p className="text-sm leading-relaxed text-gray-600">
                {t("settings.privacy.aiDescription")}
              </p>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                <div>
                  <p className="font-bold text-gray-800">
                    {t("settings.privacy.aiConsent")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("settings.privacy.aiConsentDescription")}
                  </p>
                </div>
                <Switch
                  checked={aiEnabled}
                  disabled={consentMutation.isPending}
                  onCheckedChange={(enabled) =>
                    consentMutation.mutate({
                      enabled,
                      includeJournalNotes: enabled && journalNotesEnabled,
                    })
                  }
                  aria-label={t("settings.privacy.aiConsent")}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4">
                <div>
                  <p className="font-bold text-gray-800">
                    {t("settings.privacy.aiNotes")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("settings.privacy.aiNotesDescription")}
                  </p>
                </div>
                <Switch
                  checked={journalNotesEnabled}
                  disabled={!aiEnabled || consentMutation.isPending}
                  onCheckedChange={(includeJournalNotes) =>
                    consentMutation.mutate({
                      enabled: true,
                      includeJournalNotes,
                    })
                  }
                  aria-label={t("settings.privacy.aiNotes")}
                />
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                {t("settings.privacy.aiDisclaimer")}
              </p>
            </GlassCardContent>
          </GlassCard>
        ) : null}

        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Shield className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.privacy.title")}
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent className="space-y-4">
            <a
              href="/api/export/json"
              download
              className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--sage)]/10 text-[var(--sage)]">
                  <Download className="size-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">
                    {t("settings.privacy.exportJson")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("settings.privacy.exportJsonDescription")}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-gray-400" />
            </a>

            <Link
              href="/export"
              className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Download className="size-6" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">
                    {t("settings.privacy.exportPdf")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("settings.privacy.exportPdfDescription")}
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-gray-400" />
            </Link>
            {importAvailable ? (
              <Link
                href="/settings/import"
                className="flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-[var(--primary)]/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Upload className="size-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">Import contrôlé</p>
                    <p className="text-sm text-gray-500">
                      Prévisualisez un JSON Moodday v2 ou un CSV avant toute
                      écriture.
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-gray-400" />
              </Link>
            ) : null}
          </GlassCardContent>
        </GlassCard>

        <DeleteAccountForm />

        <GlassCard padding="md" variant="elevated">
          <GlassCardContent>
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <ExternalLink className="size-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">
                  {t("settings.privacy.policyTitle")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("settings.privacy.policyDescription")}
                </p>
              </div>
              <Link
                href="/privacy"
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                {t("settings.privacy.policyCta")}
              </Link>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>
    </PageLayout>
  );
}
