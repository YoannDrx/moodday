import { createRoutineOccurrenceSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  createRoutineOccurrence,
  listRoutineOccurrences,
  RoutineOccurrenceAlreadyExistsError,
  RoutineOccurrenceUnavailableError,
} from "@/features/v2/routines/occurrence-service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({ localDate: z.iso.date() });

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) =>
    apiSuccess(
      await listRoutineOccurrences({
        userId: ctx.user.id,
        localDate: query.localDate,
      }),
      getRequestId(request),
    ),
  );

const postHandler = authRoute
  .body(createRoutineOccurrenceSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await createRoutineOccurrence(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      if (error instanceof RoutineOccurrenceUnavailableError) {
        return apiError({
          code: "routine_unavailable",
          message: "Cette routine n’est plus disponible.",
          recoverable: false,
          requestId,
          status: 404,
        });
      }
      if (error instanceof RoutineOccurrenceAlreadyExistsError) {
        return apiError({
          code: "routine_occurrence_exists",
          message: "Un état existe déjà pour cette routine aujourd’hui.",
          recoverable: false,
          requestId,
          status: 409,
        });
      }
      return apiError({
        code: "routine_occurrence_unavailable",
        message: "L’état de la routine n’a pas pu être enregistré.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
