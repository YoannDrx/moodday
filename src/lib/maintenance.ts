import { ActionError } from "@/lib/errors/action-error";
import { env } from "@/lib/env";

export const isMaintenanceMode = () => env.MAINTENANCE_MODE;

export const maintenanceApiResponse = () =>
  Response.json(
    { error: "Unavailable" },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "300",
      },
    },
  );

export const assertWritesAvailable = () => {
  if (isMaintenanceMode()) {
    throw new ActionError("Moodday is temporarily in maintenance mode");
  }
};
