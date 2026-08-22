import { createAppointmentArtifactSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  AppointmentArtifactUnavailableError,
  createAppointmentBrief,
  createAppointmentDecision,
  createAppointmentEvent,
  createAppointmentQuestion,
  listAppointmentArtifacts,
} from "@/features/v2/appointments/artifact-service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ appointmentId: z.string().min(8).max(128) });

const unavailable = (requestId: string) =>
  apiError({
    code: "appointment_artifact_unavailable",
    message: "Cet élément de rendez-vous n’est pas disponible.",
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
        await listAppointmentArtifacts(ctx.user.id, params.appointmentId),
        requestId,
      );
    } catch (error) {
      if (error instanceof AppointmentArtifactUnavailableError) {
        return unavailable(requestId);
      }
      throw error;
    }
  });

const postHandler = authRoute
  .params(paramsSchema)
  .body(createAppointmentArtifactSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      const data =
        body.kind === "question"
          ? await createAppointmentQuestion(
              ctx.user.id,
              params.appointmentId,
              body,
            )
          : body.kind === "event"
            ? await createAppointmentEvent(
                ctx.user.id,
                params.appointmentId,
                body,
              )
            : body.kind === "decision"
              ? await createAppointmentDecision(
                  ctx.user.id,
                  params.appointmentId,
                  body,
                )
              : await createAppointmentBrief(
                  ctx.user.id,
                  params.appointmentId,
                  body,
                );
      return apiSuccess(data, requestId, 201);
    } catch (error) {
      if (error instanceof AppointmentArtifactUnavailableError) {
        return unavailable(requestId);
      }
      throw error;
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
