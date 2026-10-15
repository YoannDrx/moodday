import { userDraftKindSchema } from "@moodday/contracts";
import { z } from "zod";
import { getUserDraft } from "@/features/v2/preferences-drafts/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const querySchema = z.object({
  kind: userDraftKindSchema,
  contextKey: z.string().trim().min(1).max(128),
});

const getHandler = readAuthRoute
  .query(querySchema)
  .handler(async (request, { query, ctx }) =>
    apiSuccess(
      await getUserDraft({ userId: ctx.user.id, ...query }),
      getRequestId(request),
    ),
  );

export const GET = withApiV2Route(getHandler);
