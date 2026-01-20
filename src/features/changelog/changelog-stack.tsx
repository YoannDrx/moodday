"use client";

import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import Image from "next/image";
import Link from "next/link";
import type { Changelog } from "./changelog-manager";

type ChangelogStackProps = {
  changelogs: Changelog[];
  className?: string;
};

export function ChangelogStack({ changelogs, className }: ChangelogStackProps) {
  const { t, locale } = useI18n();
  const offset = 12;
  const scaleFactor = 0.05;

  if (changelogs.length === 0) {
    return null;
  }

  const visibleCards = changelogs.slice(0, 5);

  return (
    <div
      className={cn(
        "relative w-full max-w-xl",
        visibleCards.length === 1 && "h-72",
        visibleCards.length === 2 && "h-80",
        visibleCards.length >= 3 && "h-96",
        className,
      )}
    >
      {visibleCards.map((changelog, index) => {
        const { attributes } = changelog;

        return (
          <Link
            key={changelog.slug}
            href={`/changelog/${changelog.slug}`}
            className="bg-card absolute block h-72 w-full max-w-xl overflow-hidden rounded-xl border shadow-lg transition-all duration-300 hover:shadow-xl md:h-80"
            style={{
              top: index * -offset,
              transform: `scale(${1 - index * scaleFactor})`,
              zIndex: visibleCards.length - index,
              transformOrigin: "top center",
            }}
          >
            {attributes.image && (
              <div className="relative h-40 w-full">
                <Image
                  src={attributes.image}
                  alt={attributes.title ?? t("changelog.title")}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-2 p-4">
              <p className="text-lg font-semibold">
                {attributes.title ?? t("changelog.newUpdate")}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatDate(attributes.date, locale)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
