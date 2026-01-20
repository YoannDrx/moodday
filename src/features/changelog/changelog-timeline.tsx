import { Typography } from "@/components/nowts/typography";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { Changelog } from "./changelog-manager";

type ChangelogTimelineProps = {
  changelogs: Changelog[];
  className?: string;
};

const getExcerpt = (content: string, maxLength = 120): string => {
  const firstParagraph = content
    .split("\n")
    .find(
      (line) => line.trim() && !line.startsWith("#") && !line.startsWith("-"),
    );

  if (!firstParagraph) {
    return "";
  }

  const cleaned = firstParagraph.trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.substring(0, maxLength).trim()}...`;
};

export function ChangelogTimeline({
  changelogs,
  className,
}: ChangelogTimelineProps) {
  const { t, locale } = useI18n();

  return (
    <div className={cn("relative", className)}>
      <div className="bg-border absolute top-0 bottom-0 left-[9px] w-px md:left-[11px]" />

      <div className="flex flex-col gap-8">
        {changelogs.map((changelog, index) => {
          const { attributes } = changelog;
          const excerpt = getExcerpt(changelog.content);
          const isFirst = index === 0;
          const isLast = index === changelogs.length - 1;
          const date = new Date(attributes.date);

          return (
            <Link
              key={changelog.slug}
              href={`/changelog/${changelog.slug}`}
              className="group relative flex gap-6"
              data-changelog-item
            >
              <div className="relative z-10 flex shrink-0 flex-col items-center">
                <div
                  className={cn(
                    "bg-background flex size-5 items-center justify-center rounded-full border-2 transition-colors md:size-6",
                    isFirst
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/40 group-hover:border-primary",
                  )}
                >
                  <div
                    className={cn(
                      "size-2 rounded-full md:size-2.5",
                      isFirst
                        ? "bg-primary-foreground"
                        : "bg-muted-foreground/40 group-hover:bg-primary",
                    )}
                  />
                </div>
                {isLast && (
                  <div className="bg-background absolute top-6 bottom-0 left-1/2 w-4 -translate-x-1/2" />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 pb-2">
                <div className="flex items-center gap-3">
                  <Typography
                    variant="muted"
                    className="text-xs tracking-wider uppercase"
                  >
                    {date.toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                  {isFirst && (
                    <Badge variant="default" className="text-xs">
                      {t("changelog.latest")}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-4">
                  {attributes.image && (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg md:size-20">
                      <Image
                        src={attributes.image}
                        alt={attributes.title ?? t("changelog.title")}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Typography
                        variant="h3"
                        className="group-hover:text-primary text-base transition-colors md:text-lg"
                      >
                        {attributes.title ?? t("changelog.newUpdate")}
                      </Typography>
                      {attributes.version && (
                        <Badge variant="outline" className="text-xs">
                          v{attributes.version}
                        </Badge>
                      )}
                    </div>
                    {excerpt && (
                      <Typography variant="muted" className="line-clamp-2">
                        {excerpt}
                      </Typography>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
