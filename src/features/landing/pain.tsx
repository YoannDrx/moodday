"use client";

import { Typography } from "@/components/nowts/typography";
import { useI18n } from "@/i18n/provider";
import { SectionLayout } from "./section-layout";

export const PainSection = () => {
  const { t, tm } = useI18n();
  const withoutItems = tm<string[]>("landing.pain.without.items") ?? [];
  const withItems = tm<string[]>("landing.pain.with.items") ?? [];

  return (
    <SectionLayout
      variant="card"
      size="base"
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="flex w-full flex-col items-center gap-3 lg:gap-4 xl:gap-6">
        <Typography variant="h1">{t("landing.pain.title")}</Typography>
        <Typography variant="large">{t("landing.pain.subtitle")}</Typography>
        <div className="flex items-start gap-4 max-lg:flex-col">
          <div className="flex-1 rounded-lg bg-red-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-red-500">
              {t("landing.pain.without.title")}
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              {withoutItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 rounded-lg bg-green-500/20 p-4 lg:p-6">
            <Typography variant="h3" className="text-green-500">
              {t("landing.pain.with.title")}
            </Typography>
            <ul className="text-foreground/80 mt-4 ml-4 flex list-disc flex-col gap-2 text-lg">
              {withItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionLayout>
  );
};
