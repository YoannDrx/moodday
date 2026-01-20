"use client";

import type { BadgeProps } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { DocType } from "../doc-manager";
import { useI18n } from "@/i18n/provider";

type DocSidebarProps = {
  docs: DocType[];
};

export function DocSidebar({ docs }: DocSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const generalLabel = t("docs.general");

  const groupedDocs = useMemo(() => {
    const grouped: Record<string, typeof docs> = {
      [generalLabel]: [],
    };

    for (const doc of docs) {
      const subcategory = doc.attributes.subcategory ?? generalLabel;
      grouped[subcategory] ??= [];
      grouped[subcategory].push(doc);
    }

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        if (
          a.attributes.order !== undefined &&
          b.attributes.order !== undefined
        ) {
          return a.attributes.order - b.attributes.order;
        }
        return a.attributes.title.localeCompare(b.attributes.title);
      });
    });

    return grouped;
  }, [docs, generalLabel]);

  const sortedSubcategories = useMemo(() => {
    return Object.keys(groupedDocs).sort((a, b) => {
      if (a === generalLabel) return -1;
      if (b === generalLabel) return 1;
      return a.localeCompare(b);
    });
  }, [generalLabel, groupedDocs]);

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r lg:block">
      <nav className="flex flex-col gap-6 p-6">
        {sortedSubcategories.map((subcategory) => {
          const subcategoryDocs = groupedDocs[subcategory];

          if (subcategoryDocs.length === 0) return null;

          return (
            <div key={subcategory} className="flex flex-col gap-3">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {subcategory}
              </h4>
              <ul className="flex flex-col gap-1">
                {subcategoryDocs.map((doc) => {
                  const href = `/docs/${doc.slug}`;
                  const isActive = pathname === href;
                  return (
                    <li key={doc.slug}>
                      <DocLink doc={doc} isActive={isActive} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

type DocLinkProps = {
  doc: DocType;
  isActive: boolean;
};

const getBadgeColor = (method: string): BadgeProps["color"] => {
  if (method === "GET") return "blue";
  if (method === "POST") return "green";
  if (method === "PUT") return "yellow";
  if (method === "DELETE") return "red";
  return "zinc";
};

function DocLink({ doc, isActive }: DocLinkProps) {
  return (
    <Link
      href={`/docs/${doc.slug}`}
      className={cn(
        "hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
        isActive ? "bg-accent text-foreground" : "text-muted-foreground",
      )}
    >
      {doc.attributes.method ? (
        <Badge color={getBadgeColor(doc.attributes.method)}>
          {doc.attributes.method}
        </Badge>
      ) : null}
      {doc.attributes.title}
    </Link>
  );
}
