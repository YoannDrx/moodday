"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton } from "@/features/auth/sign-in-button";
import { logger } from "@/lib/logger";
import type { ErrorParams } from "@/types/next";
import { useEffect } from "react";

export default function RouteError({ error }: ErrorParams) {
  useEffect(() => {
    logger.error("Account route rendering failed", {
      eventName: "account_route_render_failed",
      status: "failed",
      errorCode: error.name || "render_error",
      digest: error.digest,
    });
  }, [error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          You need to be authenticated to access this resource.
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <SignInButton variant="invert" size="lg" />
      </CardFooter>
    </Card>
  );
}
