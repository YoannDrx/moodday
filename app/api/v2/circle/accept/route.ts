import { acceptCircleInvitationSchema } from "@moodday/contracts";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import {
  acceptCircleInvitation,
  CircleAccessDeniedError,
} from "@/features/v2/circle/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const postHandler = authRoute
  .body(acceptCircleInvitationSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    const unavailable = getCircleAvailabilityError(request);
    if (unavailable) return unavailable;
    try {
      return apiSuccess(
        await acceptCircleInvitation({
          caregiverId: ctx.user.id,
          caregiverEmail: ctx.user.email,
          invitationToken: body.invitationToken,
        }),
        requestId,
      );
    } catch (error) {
      if (error instanceof CircleAccessDeniedError) {
        return apiError({
          code: "circle_invitation_invalid",
          message: "Cette invitation est invalide, expirée ou déjà utilisée.",
          recoverable: false,
          requestId,
          status: 403,
        });
      }
      throw error;
    }
  });

export const POST = withApiV2Route(postHandler);
