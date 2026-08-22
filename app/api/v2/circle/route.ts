import { createCircleInvitationSchema } from "@moodday/contracts";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import {
  createCircleInvitation,
  listCircleRelationships,
} from "@/features/v2/circle/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) => {
  const unavailable = getCircleAvailabilityError(request);
  if (unavailable) return unavailable;
  return apiSuccess(
    await listCircleRelationships(ctx.user.id),
    getRequestId(request),
  );
});

const postHandler = authRoute
  .body(createCircleInvitationSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    const unavailable = getCircleAvailabilityError(request);
    if (unavailable) return unavailable;
    try {
      return apiSuccess(
        await createCircleInvitation(ctx.user.id, body),
        requestId,
        201,
      );
    } catch {
      return apiError({
        code: "circle_invitation_unavailable",
        message: "L’invitation n’a pas pu être créée.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
