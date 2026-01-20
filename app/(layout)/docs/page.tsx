import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteConfig } from "@/site-config";
import type { PageProps } from "@/types/next";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getDocs } from "./doc-manager";
import { getI18n } from "@/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("docs.metaTitle", { app: SiteConfig.title }),
    description: t("docs.metaDescription", { app: SiteConfig.title }),
  };
}

export default async function Page(props: PageProps<"/docs">) {
  return (
    <Suspense fallback={null}>
      <DocsPage {...props} />
    </Suspense>
  );
}

async function DocsPage(_props: PageProps<"/docs">) {
  const { t, locale } = await getI18n();
  const docs = await getDocs(undefined, locale);

  const sortedDocs = [...docs].sort((a, b) => {
    if (a.attributes.order !== undefined && b.attributes.order !== undefined) {
      return a.attributes.order - b.attributes.order;
    }
    return a.attributes.title.localeCompare(b.attributes.title);
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Typography
            variant="h1"
            className="text-4xl font-bold tracking-tight"
          >
            {t("docs.title")}
          </Typography>
          <Typography variant="p" className="text-muted-foreground text-lg">
            {t("docs.description", { app: SiteConfig.title })}
          </Typography>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {sortedDocs.map((doc) => (
            <Card key={doc.slug} className="h-fit overflow-hidden">
              {doc.attributes.coverUrl && (
                <div
                  className="h-36 bg-cover bg-center"
                  style={{ backgroundImage: `url(${doc.attributes.coverUrl})` }}
                />
              )}
              <CardHeader>
                <CardTitle>{doc.attributes.title}</CardTitle>
                <CardDescription>{doc.attributes.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Link
                  href={`/docs/${doc.slug}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  {t("docs.readMore")}{" "}
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
