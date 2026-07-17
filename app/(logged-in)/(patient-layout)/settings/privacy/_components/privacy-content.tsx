"use client";

import Link from "next/link";
import { Shield, Download, ChevronRight, ExternalLink } from "lucide-react";

import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/nowts/glass-card";
import { PageLayout } from "@/components/nowts/page-layout";
import { useI18n } from "@/i18n/provider";
import { DeleteAccountForm } from "@app/(logged-in)/(account-layout)/account/danger/delete-account-form";

export function PrivacyContent() {
  const { t } = useI18n();

  return (
    <PageLayout
      title={t("settings.privacy.title")}
      subtitle={t("settings.subtitle")}
      maxWidth="3xl"
    >
      <div className="space-y-6">
        <GlassCard padding="lg" variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle
              icon={<Shield className="size-5 text-[var(--primary)]" />}
            >
              {t("settings.privacy.title")}
            </GlassCardTitle>
          </GlassCardHeader>

          <GlassCardContent className="space-y-4">
            <form action="/api/export/json" method="get">
              <button
                type="submit"
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
              </button>
            </form>

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
