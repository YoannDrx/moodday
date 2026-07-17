import { env } from "./env";

export const validateCronRequest = (request: Request) => {
  const authHeader = request.headers.get("authorization");

  if (!env.CRON_SECRET) {
    if (env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "Cron secret is not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return null;
  }

  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
};
