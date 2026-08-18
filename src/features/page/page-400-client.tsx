"use client";

import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";
import { SiteConfig } from "@/site-config";
import Link from "next/link";
import type { PropsWithChildren } from "react";
import { Typography } from "../../components/nowts/typography";
import { buttonVariants } from "../../components/ui/button";

type Page400ClientProps = PropsWithChildren<{
  title?: string;
}>;

// Pre-load messages for the default locale (error boundaries can't use context)
const messages = getMessages(defaultLocale);
const t = createTranslator(messages);

export function Page400Client(props: Page400ClientProps) {
  return (
    <main className="flex flex-col items-center gap-8">
      <div className="max-w-lg space-y-3 text-center">
        <Typography variant="code">400</Typography>
        <Typography variant="h1">
          {props.title ?? t("error.badRequest.title")}
        </Typography>
        {props.children ?? (
          <Typography>{t("error.badRequest.description")}</Typography>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Link href="/" className={buttonVariants({ variant: "invert" })}>
          {t("error.badRequest.cta")}
        </Link>
        <Link
          href={`mailto:${SiteConfig.company.email}`}
          className={buttonVariants({ variant: "outline" })}
        >
          {t("support.contact")}
        </Link>
      </div>
    </main>
  );
}
