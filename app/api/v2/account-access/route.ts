import { acceptAccountConsentsSchema } from "@moodday/contracts";
import { getUser, hasCurrentRequiredConsents } from "@/lib/auth/auth-user";
import {
  areConsentVersionsCurrent,
  getRequiredConsentVersions,
  recordRequiredConsents,
} from "@/lib/auth/required-consents";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/zod-route";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { assertWritesAvailable } from "@/lib/maintenance";

// This route deliberately requires a session but not product consent: new
// social accounts must be able to complete consent before any health API opens.
const accountRoute = route.use(async ({ next }) => {
  const user = await getUser();
  if (!user) throw new ZodRouteError("Authentication required", 401);
  const identity = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  });
  if (!identity) throw new ZodRouteError("Authentication required", 401);
  return next({ ctx: { user, emailVerified: identity.emailVerified } });
});

export const GET = withApiV2Route(
  accountRoute.handler(async (request, { ctx }) => {
    const response = apiSuccess(
      {
        emailVerified: ctx.emailVerified,
        consentsAccepted:
          ctx.emailVerified && (await hasCurrentRequiredConsents(ctx.user.id)),
        versions: getRequiredConsentVersions(),
      },
      getRequestId(request),
    );
    response.headers.set("Cache-Control", "no-store");
    return response;
  }),
);

export const POST = withApiV2Route(
  accountRoute
    .body(acceptAccountConsentsSchema)
    .handler(async (request, { ctx, body }) => {
      assertWritesAvailable();
      const requestId = getRequestId(request);
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(env.BETTER_AUTH_URL).origin)
        return apiError({
          code: "access_denied",
          message: "Cette origine n’est pas autorisée.",
          recoverable: false,
          requestId,
          status: 403,
        });
      if (!ctx.emailVerified)
        return apiError({
          code: "email_verification_required",
          message: "Vérifie ton adresse e-mail pour continuer.",
          recoverable: true,
          requestId,
          status: 403,
        });
      if (!areConsentVersionsCurrent(body.versions))
        return apiError({
          code: "consent_version_changed",
          message: "Les textes ont changé. Relis-les avant de continuer.",
          recoverable: true,
          requestId,
          status: 409,
        });
      await recordRequiredConsents(ctx.user.id, body.locale);
      if (!(await hasCurrentRequiredConsents(ctx.user.id)))
        return apiError({
          code: "consent_revoked",
          message:
            "Un consentement a été retiré. Contacte le support pour reprendre ton compte.",
          recoverable: false,
          requestId,
          status: 403,
        });
      return apiSuccess(
        {
          emailVerified: true,
          consentsAccepted: true,
          versions: getRequiredConsentVersions(),
        },
        requestId,
      );
    }),
);
