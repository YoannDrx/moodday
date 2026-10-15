import { HealthDataServiceError } from "./service";
import { apiError } from "@/lib/api-v2/responses";

export const healthErrorResponse = (error: unknown, requestId: string) => {
  if (!(error instanceof HealthDataServiceError)) return null;
  const notFound = error.code === "health_source_not_found";
  const conflict = [
    "health_source_inactive",
    "health_metric_not_permitted",
    "health_operation_conflict",
  ].includes(error.code);
  return apiError({
    code: error.code,
    message: notFound
      ? "Cette connexion Santé n’est plus disponible."
      : conflict
        ? "Les données Santé ne correspondent plus aux autorisations actives."
        : "La connexion Santé est indisponible.",
    recoverable: conflict,
    requestId,
    status: notFound ? 404 : conflict ? 409 : 503,
  });
};
