import { createDoseEventCorrectionSchema } from "@moodday/contracts";
import { z } from "zod";
import { medicationErrorResponse } from "@/features/v2/medications/http-error";
import { createDoseEventCorrection } from "@/features/v2/medications/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ doseEventId: z.string().min(1).max(128) });

const postHandler = authRoute
  .params(paramsSchema)
  .body(createDoseEventCorrectionSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    if (params.doseEventId !== body.doseEventId) {
      return apiError({
        code: "dose_event_id_mismatch",
        message: "La prise ciblée est invalide.",
        recoverable: false,
        requestId,
        status: 400,
      });
    }
    try {
      return apiSuccess(
        await createDoseEventCorrection(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      return medicationErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

export const POST = withApiV2Route(postHandler);
