import { z } from "zod";
import {
  AppointmentBriefShareUnavailableError,
  revokeAppointmentBriefShare,
} from "@/features/v2/appointments/brief-share-service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { sensitiveAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({
  briefId: z.string().min(8).max(128),
  shareId: z.string().min(8).max(128),
});

const handler = sensitiveAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await revokeAppointmentBriefShare(
          ctx.user.id,
          params.briefId,
          params.shareId,
        ),
        requestId,
      );
    } catch (error) {
      if (error instanceof AppointmentBriefShareUnavailableError) {
        return apiError({
          code: "appointment_brief_share_unavailable",
          message: "Ce lien n’est plus disponible.",
          recoverable: false,
          requestId,
          status: 404,
        });
      }
      throw error;
    }
  });

export const DELETE = withApiV2Route(handler);
