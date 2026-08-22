import { createDoseEventSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  createDoseEvent,
  DoseEventServiceError,
  listDoseEvents,
} from "@/features/v2/medications/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({
  localDate: z.iso.date(),
  timezone: z.string().min(1).max(80),
});

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) =>
    apiSuccess(
      await listDoseEvents({ userId: ctx.user.id, ...query }),
      getRequestId(request),
    ),
  );

const postHandler = authRoute
  .body(createDoseEventSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await createDoseEvent(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      if (error instanceof DoseEventServiceError) {
        const conflict = [
          "entity_id_exists",
          "scheduled_dose_exists",
          "operation_id_conflict",
        ].includes(error.code);
        return apiError({
          code: error.code,
          message: conflict
            ? "Cette prise a déjà été modifiée sur un autre appareil."
            : "Le traitement ou le type de prise n’est plus disponible.",
          recoverable: conflict,
          requestId,
          status: conflict ? 409 : 404,
        });
      }
      return apiError({
        code: "dose_event_unavailable",
        message: "La prise n’a pas pu être enregistrée.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
