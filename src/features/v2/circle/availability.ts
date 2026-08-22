import { apiError, getRequestId } from "@/lib/api-v2/responses";
import { getFeatureAvailability } from "@/lib/features/availability";

export const getCircleAvailabilityError = (request: Request) => {
  const availability = getFeatureAvailability("caregiverSharing");
  if (availability.enabled) return null;

  return apiError({
    code: "circle_unavailable",
    message: "Le Cercle n’est pas encore disponible sur cet environnement.",
    recoverable: false,
    requestId: getRequestId(request),
    status: 503,
  });
};
