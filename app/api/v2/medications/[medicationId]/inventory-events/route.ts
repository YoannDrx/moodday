import { createMedicationInventoryAdjustmentSchema } from "@moodday/contracts";
import { z } from "zod";
import { medicationErrorResponse } from "@/features/v2/medications/http-error";
import { createMedicationInventoryAdjustment } from "@/features/v2/medications/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ medicationId: z.string().min(1).max(128) });

const postHandler = authRoute
  .params(paramsSchema)
  .body(createMedicationInventoryAdjustmentSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    if (params.medicationId !== body.medicationId) {
      return apiError({
        code: "medication_id_mismatch",
        message: "Le traitement ciblé est invalide.",
        recoverable: false,
        requestId,
        status: 400,
      });
    }
    try {
      return apiSuccess(
        await createMedicationInventoryAdjustment(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      return medicationErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

export const POST = withApiV2Route(postHandler);
