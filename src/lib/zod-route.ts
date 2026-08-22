import { createZodRoute } from "next-zod-route";
import { NextResponse } from "next/server";
import { getAuthorizedApiUser } from "./auth/auth-user";
import { ApplicationError } from "./errors/application-error";
import { ZodRouteError } from "./errors/zod-route-error";
import { logger } from "./logger";
import { assertWritesAvailable } from "./maintenance";

/**
 * Base route handler with automatic error handling and validation
 *
 * @example
 * ```ts
 * export const POST = route
 *   .params(z.object({ id: z.string() }))
 *   .body(z.object({ name: z.string() }))
 *   .handler(async (req, { params, body }) => {
 *     return { success: true };
 *   });
 * ```
 */
export const route = createZodRoute({
  handleServerError: (e: Error) => {
    if (e instanceof ZodRouteError) {
      logger.debug("Route rejected", {
        eventName: "route_rejected",
        status: "rejected",
        errorCode: e.name,
      });
      return NextResponse.json(
        { message: e.message },
        {
          status: e.status,
        },
      );
    }

    if (e instanceof ApplicationError) {
      logger.debug("Route application error", {
        eventName: "route_application_error",
        status: "rejected",
        errorCode: e.name,
      });
      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    logger.info("Route failed", {
      eventName: "route_failed",
      status: "failed",
      errorCode: e.name || "unknown_error",
    });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  },
});

/**
 * Route handler with authentication middleware
 * Ensures user is logged in before accessing the route
 *
 * Use THIS route whenever you want to get the user session.
 */
export const readAuthRoute = route.use(async ({ next }) => {
  const user = await getAuthorizedApiUser();

  if (!user) {
    throw new ZodRouteError("Authenticated, verified account required", 401);
  }

  return next({
    ctx: { user },
  });
});

export const authRoute = readAuthRoute.use(async ({ next }) => {
  assertWritesAvailable();
  return next();
});
