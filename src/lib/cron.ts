import { env } from "./env";
import { timingSafeEqual } from "node:crypto";
import { maintenanceApiResponse } from "./maintenance";

const matchesSecret = (provided: string, expected: string) => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
};

export const validateCronRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization");

  if (!env.CRON_SECRET) {
    if (env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "Unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    return null;
  }

  if (!authHeader || !matchesSecret(authHeader, `Bearer ${env.CRON_SECRET}`)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (env.MAINTENANCE_MODE) return maintenanceApiResponse();

  return null;
};
