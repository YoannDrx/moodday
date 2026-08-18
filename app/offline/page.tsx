import type { Metadata } from "next";

import { getI18n } from "@/i18n/server";
import { OfflineSafetyPlan } from "@/features/safety-plan/offline-safety-plan";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("offline.metaTitle"),
  };
}

export default async function OfflinePage() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{t("offline.title")}</h1>
        <p className="text-muted-foreground mt-3">
          {t("offline.description")}
        </p>
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-50 p-5 text-left text-gray-900">
          <h2 className="font-semibold">Aide immédiate en France</h2>
          <p className="mt-2 text-sm">
            Moodday n’est pas un service d’urgence et ne contacte personne
            automatiquement.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a className="font-semibold underline" href="tel:3114">
                3114
              </a>{" "}
              — prévention du suicide, 24 h/24
            </li>
            <li>
              <a className="font-semibold underline" href="tel:15">
                15
              </a>{" "}
              — SAMU
            </li>
            <li>
              <a className="font-semibold underline" href="tel:112">
                112
              </a>{" "}
              — numéro d’urgence européen
            </li>
          </ul>
        </div>
        <OfflineSafetyPlan />
      </div>
    </div>
  );
}
