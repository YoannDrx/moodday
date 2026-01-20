
import { Typography } from "@/components/nowts/typography";
import { Button } from "@/components/ui/button";
import { ServerMdx } from "@/features/markdown/server-mdx";
import { SiteConfig } from "@/site-config";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defaultLocale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { DocsApiExamples } from "../_components/docs-api-examples";
import { DocsCopyPage } from "../_components/docs-copy-page";
import { DocsTableOfContents, type TocItem } from "../_components/docs-toc";
import type { DocParams } from "../doc-manager";
import { getCurrentDoc, getDocs } from "../doc-manager";

export async function generateMetadata(props: DocParams): Promise<Metadata> {
  const params = await props.params;
  const { locale } = await getI18n();
  const doc = await getCurrentDoc(params.slug, locale);

  if (!doc) {
    notFound();
  }

  return {
    title: doc.attributes.title,
    description: doc.attributes.description,
    keywords: doc.attributes.keywords,
  };
}

export async function generateStaticParams() {
  const docs = await getDocs(undefined, defaultLocale);

  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

function extractToc(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const toc: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const depth = match[1].length;
    const title = match[2].trim();
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    toc.push({
      title,
      url: `#${slug}`,
      depth,
    });
  }

  return toc;
}

export default async function page(props: DocParams) {

  const params = await props.params;
  const { locale } = await getI18n();
  const doc = await getCurrentDoc(params.slug, locale);

  if (!doc) {
    notFound();
  }

  const docs = await getDocs(undefined, locale);
  const sortedDocs = docs.sort((a, b) => {
    if (a.attributes.order !== undefined && b.attributes.order !== undefined) {
      return a.attributes.order - b.attributes.order;
    }
    return a.attributes.title.localeCompare(b.attributes.title);
  });

  const currentIndex = sortedDocs.findIndex((d) => d.slug === doc.slug);
  const neighbours = {
    previous: currentIndex > 0 ? sortedDocs[currentIndex - 1] : null,
    next:
      currentIndex < sortedDocs.length - 1
        ? sortedDocs[currentIndex + 1]
        : null,
  };

  const method = doc.attributes.method as
    | "GET"
    | "POST"
    | "PATCH"
    | "DELETE"
    | "PUT"
    | undefined;
  const { endpoint, examples, results } = doc.attributes;

  const hasApiExamples = method ?? endpoint ?? examples ?? results;
  const toc = extractToc(doc.content);
  const pageUrl = `${SiteConfig.prodUrl}/docs/${doc.slug}`;

  return (
    <div
      className={
        hasApiExamples ? "xl:pr-[800px]" : toc.length > 0 ? "xl:pr-64" : ""
      }
    >
      <div className="flex w-full">
        <div className="flex min-w-0 flex-1">
          <div className="mx-auto w-fit px-8 py-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-8">
                  <Typography
                    variant="h1"
                    className="text-4xl font-bold tracking-tight"
                  >
                    {doc.attributes.title}
                  </Typography>
                  <DocsCopyPage page={doc.content} url={pageUrl} />
                </div>
                {doc.attributes.description && (
                  <Typography
                    variant="p"
                    className="text-muted-foreground text-lg"
                  >
                    {doc.attributes.description}
                  </Typography>
                )}
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <ServerMdx source={doc.content} />
              </div>

              <div className="border-border flex items-center justify-between border-t pt-6">
                {neighbours.previous && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/docs/${neighbours.previous.slug}`}>
                      <ArrowLeft className="size-4" />
                      {neighbours.previous.attributes.title}
                    </Link>
                  </Button>
                )}
                {neighbours.next && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    asChild
                  >
                    <Link href={`/docs/${neighbours.next.slug}`}>
                      {neighbours.next.attributes.title}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="fixed top-16 right-0 hidden h-[calc(100vh-4rem)] overflow-y-auto xl:flex">
          {hasApiExamples && (
            <aside className="bg-background w-96 overflow-y-auto border-l">
              <div className="p-6">
                <DocsApiExamples
                  method={method}
                  endpoint={endpoint}
                  examples={examples}
                  results={results}
                />
              </div>
            </aside>
          )}

          {toc.length > 0 && (
            <aside className="bg-background w-64 overflow-y-auto border-l">
              <div className="p-6">
                <DocsTableOfContents toc={toc} />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
