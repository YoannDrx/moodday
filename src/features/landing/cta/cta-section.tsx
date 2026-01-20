import { Typography } from "@/components/nowts/typography";
import { buttonVariants } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import Link from "next/link";
import { SectionLayout } from "../section-layout";

export async function CtaSection() {
  const { t } = await getI18n();

  return (
    <SectionLayout className="lg:flex lg:items-center lg:justify-between lg:px-8">
      <Typography variant="h3">
        <Typography variant="h2" as="span">
          {t("landing.cta.title")}
        </Typography>
        <br />
        <span className="text-muted-foreground">
          {t("landing.cta.subtitle")}
        </span>
      </Typography>
      <div className="mt-10 flex items-center gap-x-6 lg:mt-0 lg:shrink-0">
        <Link className={buttonVariants({ size: "lg" })} href="#pricing">
          {t("landing.cta.button")}
        </Link>
      </div>
    </SectionLayout>
  );
}
