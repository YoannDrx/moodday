import "server-only";

import { apiError } from "@/lib/api-v2/responses";
import { CalendarConnectionError } from "./connection-service";

export const calendarErrorResponse = (error: unknown, requestId: string) => {
  if (!(error instanceof CalendarConnectionError)) return null;
  const unavailable =
    error.code === "calendar_connection_unavailable" ||
    error.code === "calendar_conflict_unavailable";
  const conflict =
    error.code === "calendar_sync_already_running" ||
    error.code === "calendar_conflict_changed_again" ||
    error.code === "calendar_connection_not_active" ||
    error.code.includes("authorization_required") ||
    error.code.includes("recent_consent_required") ||
    error.code.includes("reauthorization_required") ||
    error.code.includes("token_unavailable");
  return apiError({
    code: error.code,
    message: unavailable
      ? "Cette connexion calendrier n’est pas disponible."
      : conflict
        ? "La connexion Google Agenda doit être confirmée avant de continuer."
        : "Google Agenda est momentanément indisponible.",
    recoverable: error.recoverable,
    requestId,
    status: unavailable ? 404 : conflict ? 409 : 503,
  });
};
