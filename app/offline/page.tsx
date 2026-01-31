import type { Metadata } from "next";

import { getI18n } from "@/i18n/server";

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
      </div>
    </div>
  );
}
