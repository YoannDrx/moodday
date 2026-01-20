import { createSafeActionClient } from "next-safe-action";
import { getRequiredUser } from "../auth/auth-user";
import { ActionError } from "../errors/action-error";
import { ApplicationError } from "../errors/application-error";
import { logger } from "../logger";

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
export const action = createSafeActionClient({
  handleServerError,
});

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
export const authAction = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
  const user = await getRequiredUser();

  return next({
    ctx: {
      user: user,
    },
  });
});

/**
 * Admin-only safe action client
 *
 * @description
 * - Validates user session and admin role using getRequiredUser()
 * - Throws ActionError if user is not authenticated or not an admin
 * - Provides authenticated admin user in context as ctx.user
 * - Ensures all actions require admin privileges
 *
 * Use this for actions that require admin role access.
 */
export const adminAction = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
  const user = await getRequiredUser();

  if (user.role !== "admin") {
    throw new ActionError("You must be an admin to perform this action.");
  }

  return next({
    ctx: {
      user: user,
    },
  });
});

function handleServerError(e: Error) {
  if (e instanceof ApplicationError) {
    logger.debug("[DEV] - Action Error", e.message);
    return e.message;
  }

  logger.info("Unknown Error", e);

  if (process.env.NODE_ENV === "development") {
    return e.message;
  }

  return "An unexpected error occurred.";
}
