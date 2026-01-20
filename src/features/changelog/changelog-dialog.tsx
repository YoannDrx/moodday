import { Badge } from "@/components/ui/badge";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterceptDialog } from "@/components/utils/intercept-dialog";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { getI18n } from "@/i18n/server";
import { formatDate } from "@/lib/format/date";
import { Calendar, Tag } from "lucide-react";
import Image from "next/image";
import type { Changelog } from "./changelog-manager";

type ChangelogDialogProps = {
  changelog: Changelog;
};

export async function ChangelogDialog({ changelog }: ChangelogDialogProps) {
  const { locale } = await getI18n();
  const { attributes, content } = changelog;
  const title = attributes.title ?? formatDate(attributes.date, locale);

  return (
    <InterceptDialog>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0 sm:max-w-3xl">
        {attributes.image && (
          <div className="relative aspect-video w-full">
            <Image
              src={attributes.image}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <DialogHeader className="space-y-3 px-4 pt-4 sm:space-y-4 sm:px-6 sm:pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {attributes.version && (
              <Badge variant="default" className="gap-1">
                <Tag size={12} />v{attributes.version}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Calendar size={12} />
              {formatDate(attributes.date, locale)}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold sm:text-2xl">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="border-border border-t" />
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <ServerMdx
            className="prose dark:prose-invert max-w-none"
            source={content}
          />
        </div>
      </DialogContent>
    </InterceptDialog>
  );
}
