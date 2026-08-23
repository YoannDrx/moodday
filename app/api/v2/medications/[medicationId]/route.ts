import { updateMedicationSchema } from "@moodday/contracts";
import { z } from "zod";
import { medicationErrorResponse } from "@/features/v2/medications/http-error";
import {
  DoseEventServiceError,
  getMedicationDetail,
  updateMedication,
} from "@/features/v2/medications/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ medicationId: z.string().min(1).max(128) });

const getHandler = readAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await getMedicationDetail(ctx.user.id, params.medicationId),
        requestId,
      );
    } catch (error) {
      return medicationErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

const patchHandler = authRoute
  .params(paramsSchema)
  .body(updateMedicationSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    if (params.medicationId !== body.medicationId) {
      return medicationErrorResponse(
        new DoseEventServiceError("medication_id_mismatch"),
        requestId,
      );
    }
    try {
      return apiSuccess(await updateMedication(ctx.user.id, body), requestId);
    } catch (error) {
      return medicationErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

export const GET = withApiV2Route(getHandler);
export const PATCH = withApiV2Route(patchHandler);
