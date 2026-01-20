"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { defaultLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { createTranslator } from "@/i18n/translator";
import { logger } from "@/lib/logger";
import type { ErrorParams } from "@/types/next";
import { useEffect } from "react";

const messages = getMessages(defaultLocale);
const t = createTranslator(messages);

export default function RouteError({ error, reset }: ErrorParams) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("error.badRequest.title")}</CardTitle>
      </CardHeader>
      <CardFooter>
        <Button onClick={reset}>{t("actions.tryAgain")}</Button>
      </CardFooter>
    </Card>
  );
}
