import { createAppointmentBriefShareSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  AppointmentBriefShareUnavailableError,
  createAppointmentBriefShare,
  listAppointmentBriefShares,
} from "@/features/v2/appointments/brief-share-service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute, sensitiveAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ briefId: z.string().min(8).max(128) });

const unavailable = (requestId: string) =>
  apiError({
    code: "appointment_brief_unavailable",
    message: "Ce brief n’est pas disponible.",
    recoverable: false,
    requestId,
    status: 404,
  });

const getHandler = readAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await listAppointmentBriefShares(ctx.user.id, params.briefId),
        requestId,
      );
    } catch (error) {
      if (error instanceof AppointmentBriefShareUnavailableError) {
        return unavailable(requestId);
      }
      throw error;
    }
  });

const postHandler = sensitiveAuthRoute
  .params(paramsSchema)
  .body(createAppointmentBriefShareSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await createAppointmentBriefShare(ctx.user.id, params.briefId, body),
        requestId,
        201,
      );
    } catch (error) {
      if (error instanceof AppointmentBriefShareUnavailableError) {
        return unavailable(requestId);
      }
      throw error;
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
