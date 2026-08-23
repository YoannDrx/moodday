import {
  RevenueCatConfigurationError,
  RevenueCatSubscriberError,
  syncRevenueCatCustomer,
} from "@/lib/billing/revenuecat";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const handler = authRoute.handler(async (request, { ctx }) => {
  const requestId = getRequestId(request);
  try {
    return apiSuccess(await syncRevenueCatCustomer(ctx.user.id), requestId);
  } catch (error) {
    const unavailable =
      error instanceof RevenueCatConfigurationError ||
      error instanceof RevenueCatSubscriberError;
    return apiError({
      code: unavailable ? error.message : "mobile_entitlement_refresh_failed",
      message:
        "Le statut de l’abonnement mobile n’a pas pu être actualisé pour le moment.",
      recoverable: true,
      requestId,
      status: 503,
    });
  }
});

export const POST = withApiV2Route(handler);
