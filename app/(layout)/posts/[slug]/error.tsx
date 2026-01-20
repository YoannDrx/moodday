"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout, LayoutHeader, LayoutTitle } from "@/features/page/layout";
import { useI18n } from "@/i18n/provider";
import { logger } from "@/lib/logger";
import type { ErrorParams } from "@/types/next";
import { useEffect } from "react";

export default function RouteError({ error, reset }: ErrorParams) {
  const { t } = useI18n();

  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <Layout>
      <LayoutHeader>
        <LayoutTitle>{t("posts.error.title")}</LayoutTitle>
      </LayoutHeader>
      <Card>
        <CardHeader>
          <CardTitle>{t("posts.error.description")}</CardTitle>
        </CardHeader>
        <CardFooter>
          <Button onClick={reset}>{t("actions.tryAgain")}</Button>
        </CardFooter>
      </Card>
    </Layout>
  );
}
