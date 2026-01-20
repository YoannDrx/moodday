import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format/date";
import Image from "next/image";
import type { Changelog } from "./changelog-manager";

type ChangelogItemProps = {
  changelog: Changelog;
  showImage?: boolean;
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

export async function ChangelogItem({
  changelog,
  showImage = true,
}: ChangelogItemProps) {
  const { t, locale } = await getI18n();
  const { attributes } = changelog;
  const excerpt = getExcerpt(changelog.content);

  return (
    <Item variant="outline" className="flex-col items-start">
      {showImage && attributes.image && (
        <ItemHeader>
          <Image
            src={attributes.image}
            alt={attributes.title ?? t("changelog.title")}
            width={400}
            height={200}
            className="aspect-video w-full rounded-sm object-cover"
          />
        </ItemHeader>
      )}
      <ItemContent>
        <ItemTitle>
          <span>{attributes.title ?? t("changelog.newUpdate")}</span>
        </ItemTitle>
        <p className="text-muted-foreground text-xs">
          {formatDate(attributes.date, locale)}
        </p>
        {excerpt && <ItemDescription>{excerpt}</ItemDescription>}
      </ItemContent>
    </Item>
  );
}
