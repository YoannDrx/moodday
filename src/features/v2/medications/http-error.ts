import { apiError } from "@/lib/api-v2/responses";
import { DoseEventServiceError } from "./service";

export const medicationErrorResponse = (error: unknown, requestId: string) => {
  if (!(error instanceof DoseEventServiceError)) return null;
  const notFound = ["dose_event_not_found", "medication_not_found"].includes(
    error.code,
  );
  const conflict = [
    "entity_id_exists",
    "scheduled_dose_exists",
    "operation_id_conflict",
    "dose_version_conflict",
    "medication_version_conflict",
  ].includes(error.code);
  const invalid = [
    "dose_kind_mismatch",
    "dose_correction_no_change",
    "inventory_negative",
    "end_date_before_start_date",
    "medication_id_mismatch",
  ].includes(error.code);
  return apiError({
    code: error.code,
    message: notFound
      ? "Ce traitement ou cette prise n’est plus disponible."
      : conflict
        ? "Cet élément a changé sur un autre appareil. Actualise avant de recommencer."
        : invalid
          ? "Cette correction ne peut pas être appliquée telle quelle."
          : "Le traitement n’a pas pu être mis à jour.",
    recoverable: conflict,
    requestId,
    status: notFound ? 404 : conflict ? 409 : invalid ? 422 : 503,
  });
};
