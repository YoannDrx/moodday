import { z } from "zod";
import { listMedications } from "@/features/v2/medications/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  includeArchived: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) =>
    apiSuccess(
      await listMedications({
        userId: ctx.user.id,
        cursor: query.cursor,
        limit: query.limit,
        includeArchived: query.includeArchived,
      }),
      getRequestId(request),
    ),
  );

export const GET = withApiV2Route(getHandler);
