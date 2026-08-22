import { AppointmentBriefPdfDocument } from "@/features/v2/appointments/brief-pdf-document";
import {
  AppointmentBriefShareUnavailableError,
  getOwnedAppointmentBrief,
} from "@/features/v2/appointments/brief-share-service";
import { apiError, getRequestId, withApiV2Route } from "@/lib/api-v2/responses";
import { sensitiveReadAuthRoute } from "@/lib/zod-route";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const paramsSchema = z.object({ briefId: z.string().min(8).max(128) });
const querySchema = z.object({ locale: z.enum(["fr", "en"]).default("fr") });

const handler = sensitiveReadAuthRoute
  .params(paramsSchema)
  .query(querySchema)
  .handler(async (request, { params, query, ctx }) => {
    const requestId = getRequestId(request);
    try {
      const brief = await getOwnedAppointmentBrief(ctx.user.id, params.briefId);
      const buffer = await renderToBuffer(
        AppointmentBriefPdfDocument({ brief, locale: query.locale }),
      );
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Disposition": `attachment; filename="moodday-brief-v${brief.version}.pdf"`,
          "Content-Type": "application/pdf",
          "X-Content-Type-Options": "nosniff",
          "X-Request-Id": requestId,
        },
      });
    } catch (error) {
      if (error instanceof AppointmentBriefShareUnavailableError) {
        return apiError({
          code: "appointment_brief_unavailable",
          message: "Ce brief n’est pas disponible.",
          recoverable: false,
          requestId,
          status: 404,
        });
      }
      throw error;
    }
  });

export const GET = withApiV2Route(handler);
