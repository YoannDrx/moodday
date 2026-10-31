import { readAllyLesson } from "@/features/couple/ally-content";
import { listCompletedLessons } from "@/features/couple/ally.service";
import { respond } from "@/features/couple/api";
import { CoupleError } from "@/features/couple/shared";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";
import { z } from "zod";

/** Lesson content for the native app, which renders it without a web session. */
export const GET = withApiV2Route(
  readAuthRoute
    .params(z.object({ slug: z.string().min(1).max(80) }))
    .handler(async (request, { ctx, params }) =>
      respond(request, async () => {
        const lesson = await readAllyLesson(params.slug);
        if (!lesson)
          throw new CoupleError("unknown_lesson", "Cette leçon n'existe pas.");
        const completed = await listCompletedLessons(ctx.user.id);
        const { review: _review, ...content } = lesson;
        return { ...content, completed: completed.includes(params.slug) };
      }),
    ),
);
