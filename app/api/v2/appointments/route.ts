import { createAppointmentSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  createAppointment,
  listAppointments,
} from "@/features/v2/appointments/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    const data = await listAppointments({
      userId: ctx.user.id,
      cursor: query.cursor,
      limit: query.limit,
    });
    return apiSuccess(data, requestId);
  });

const postHandler = authRoute
  .body(createAppointmentSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await createAppointment(ctx.user.id, body),
        requestId,
        201,
      );
    } catch {
      return apiError({
        code: "appointment_unavailable",
        message: "Le rendez-vous n’a pas pu être enregistré.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
