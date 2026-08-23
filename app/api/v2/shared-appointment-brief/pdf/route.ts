import { resolveAppointmentBriefShareSchema } from "@moodday/contracts";
import { AppointmentBriefPdfDocument } from "@/features/v2/appointments/brief-pdf-document";
import {
  AppointmentBriefShareUnavailableError,
  resolveAppointmentBriefShare,
} from "@/features/v2/appointments/brief-share-service";
import { apiError, getRequestId } from "@/lib/api-v2/responses";
import { enforceRateLimit } from "@/lib/rate-limit";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const inputSchema = resolveAppointmentBriefShareSchema.extend({
  locale: z.enum(["fr", "en"]).default("fr"),
});

const rateLimitIdentifier = (request: Request) =>
  request.headers.get("x-vercel-forwarded-for") ??
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "unknown";

const privateResponse = <T extends Response>(response: T) => {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const input = inputSchema.safeParse(body);
  if (!input.success) {
    return privateResponse(
      apiError({
        code: "invalid_request",
        message: "Le lien de partage est invalide.",
        recoverable: false,
        requestId,
        status: 400,
      }),
    );
  }
  try {
    await enforceRateLimit({
      scope: "public-appointment-brief-pdf",
      identifier: rateLimitIdentifier(request),
      max: 10,
      windowSeconds: 15 * 60,
    });
  } catch {
    return privateResponse(
      apiError({
        code: "rate_limit_exceeded",
        message: "Trop de téléchargements. Réessaie plus tard.",
        recoverable: true,
        requestId,
        status: 429,
      }),
    );
  }
  try {
    const { brief } = await resolveAppointmentBriefShare(input.data.token);
    const buffer = await renderToBuffer(
      AppointmentBriefPdfDocument({ brief, locale: input.data.locale }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "Content-Disposition": `attachment; filename="moodday-brief-v${brief.version}.pdf"`,
        "Content-Type": "application/pdf",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    if (error instanceof AppointmentBriefShareUnavailableError) {
      return privateResponse(
        apiError({
          code: "appointment_brief_share_unavailable",
          message: "Ce lien a expiré ou a été révoqué.",
          recoverable: false,
          requestId,
          status: 404,
        }),
      );
    }
    throw error;
  }
}
