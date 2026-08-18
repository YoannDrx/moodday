import { ExportPDFDocument } from "@/features/export/pdf-document";
import { getExportData } from "@/features/export/export.action";
import { getI18n } from "@/i18n/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const querySchema = z
  .object({
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    preparationId: z.string().optional(),
  })
  .refine(({ startDate, endDate }) => startDate <= endDate);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = querySchema.safeParse({
    startDate: url.searchParams.get("startDate"),
    endDate: url.searchParams.get("endDate"),
    preparationId: url.searchParams.get("preparationId") ?? undefined,
  });
  if (!input.success) {
    return Response.json({ code: "invalid_export_range" }, { status: 400 });
  }

  const result = await getExportData({
    ...input.data,
    purpose: "consultation-report",
  });
  if (result.serverError || !result.data) {
    return Response.json({ code: "export_unavailable" }, { status: 403 });
  }

  const { locale, t } = await getI18n();
  const buffer = await renderToBuffer(
    ExportPDFDocument({
      data: result.data,
      locale,
      translate: t,
    }),
  );
  const filename = `moodday-export-${input.data.startDate}-${input.data.endDate}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
