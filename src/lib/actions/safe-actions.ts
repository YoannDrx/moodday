import { createSafeActionClient } from "next-safe-action";
import {
  getRequiredAdmin,
  getRequiredUser,
  getRequiredVerifiedUser,
  getRequiredRecentUser,
} from "../auth/auth-user";
import { ApplicationError } from "../errors/application-error";
import { logger } from "../logger";
import { assertWritesAvailable } from "../maintenance";

/**
 * Base safe action client with error handling
 *
 * @description
 * The foundation client that provides:
 * - Comprehensive error handling and logging
 * - User-friendly error messages in production
 * - Full error details in development
 * - No authentication or authorization requirements
 *
 * Use this for public actions that don't require user authentication.
 *
 * @example
 * ```ts
 * export const subscribeNewsletter = action
 *   .inputSchema(z.object({
 *     email: z.string().email(),
 *     name: z.string().optional()
 *   }))
 *   .action(async ({ parsedInput: { email, name } }) => {
 *     await addToNewsletter(email, name);
 *     return { subscribed: true };
 *   });
 * ```
 */
const baseActionClient = createSafeActionClient({
  handleServerError,
});

const writeActionClient = baseActionClient.use(async ({ next }) => {
  assertWritesAvailable();
  return next();
});

export const action = writeActionClient;

/**
 * Authenticated safe action client
 *
 * @description
 * - Validates user session using getRequiredUser()
 * - Throws ActionError if no valid session found
 * - Provides authenticated user in context as ctx.user
 * - Ensures all actions require valid authentication
 *
 * Use this for actions that require a logged-in user but no specific permissions.
 *
 * @example
 * ```ts
 * export const updateProfile = authAction
 *   .inputSchema(z.object({
 *     name: z.string().min(1),
 *     bio: z.string().optional(),
 *   }))
 *   .action(async ({ parsedInput: { name, bio }, ctx: { user } }) => {
 *     // user is guaranteed to be authenticated
 *     await updateUserProfile(user.id, { name, bio });
 *     return { updated: true };
 *   });
 * ```
 */
export const authAction = writeActionClient.use(async ({ next }) => {
  const user = await getRequiredUser();

  return next({
    ctx: {
      user: user,
    },
  });
});

export const verifiedAuthAction = writeActionClient.use(async ({ next }) => {
  const user = await getRequiredVerifiedUser();
  return next({ ctx: { user } });
});

export const sensitiveAuthAction = writeActionClient.use(async ({ next }) => {
  const user = await getRequiredRecentUser();
  return next({ ctx: { user } });
});

/**
 * Admin-only safe action client
 *
 * @description
 * - Validates user session and admin role using getRequiredAdmin()
 * - Throws ActionError if user is not authenticated or not an admin
 * - Provides authenticated admin user in context as ctx.user
 * - Ensures all actions require admin privileges
 *
 * Use this for actions that require admin role access.
 */
export const adminAction = writeActionClient.use(async ({ next }) => {
  const user = await getRequiredAdmin();

  return next({
    ctx: {
      user: user,
    },
  });
});

function handleServerError(e: Error) {
  if (e instanceof ApplicationError) {
    logger.debug("Action rejected", {
      eventName: "action_rejected",
      status: "rejected",
      errorCode: e.name,
    });
    return e.message;
  }

  logger.info("Action failed", {
    errorCode: "action_failed",
    errorName: e.name,
  });

  return "An unexpected error occurred.";
}
