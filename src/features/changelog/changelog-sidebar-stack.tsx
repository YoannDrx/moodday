"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/provider";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Changelog } from "./changelog-manager";

const DISMISSED_CHANGELOGS_STORAGE_KEY = "moodday:dismissed-changelogs";

function readDismissedChangelogs() {
  try {
    const value = window.localStorage.getItem(DISMISSED_CHANGELOGS_STORAGE_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === "string")
      : [];
  } catch {
    return [];
  }
}

type ChangelogSidebarStackProps = {
  changelogs: Changelog[];
  className?: string;
};

export function ChangelogSidebarStack({
  changelogs: initialChangelogs,
  className,
}: ChangelogSidebarStackProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [changelogs, setChangelogs] = useState(initialChangelogs);

  useEffect(() => {
    const dismissed = new Set(readDismissedChangelogs());
    setChangelogs(
      initialChangelogs.filter((changelog) => !dismissed.has(changelog.slug)),
    );
  }, [initialChangelogs]);

  const handleDismiss = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const dismissed = new Set(readDismissedChangelogs());
    dismissed.add(slug);
    window.localStorage.setItem(
      DISMISSED_CHANGELOGS_STORAGE_KEY,
      JSON.stringify([...dismissed]),
    );
    setChangelogs((current) =>
      current.filter((changelog) => changelog.slug !== slug),
    );
  };

  if (changelogs.length === 0) {
    return null;
  }

  const visibleCards = changelogs.slice(0, 3);

  return (
    <div
      className={cn("relative mt-4 h-40 w-full", className)}
      data-changelog-stack
    >
      {visibleCards.map((changelog, index) => {
        const { attributes } = changelog;

        return (
          <div
            key={changelog.slug}
            className="bg-card absolute inset-x-0 cursor-pointer overflow-hidden rounded-lg border shadow-lg"
            style={{
              top: index * -8,
              transform: `scale(${1 - index * 0.04})`,
              zIndex: visibleCards.length - index,
              transformOrigin: "top center",
            }}
            onClick={() => router.push(`/changelog/${changelog.slug}`)}
          >
            <div className="block">
              {attributes.image && (
                <div className="relative aspect-[2.5/1] w-full">
                  <Image
                    src={attributes.image}
                    alt={attributes.title ?? t("changelog.title")}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-2 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {attributes.title ?? t("changelog.newUpdate")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(attributes.date, locale)}
                  </p>
                </div>
                {index === 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground size-6 shrink-0"
                    onClick={(e) => handleDismiss(changelog.slug, e)}
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
