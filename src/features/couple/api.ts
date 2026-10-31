import "server-only";

import { apiError, apiSuccess, getRequestId } from "@/lib/api-v2/responses";
import { getUserContext, CoupleError } from "./shared";

/**
 * Runs a couple-domain operation for an API v2 route and maps business rule
 * violations to stable, recoverable error codes for the native client.
 */
export const respond = async <T>(
  request: Request,
  operation: () => Promise<T>,
  status = 200,
) => {
  const requestId = getRequestId(request);
  try {
    const response = apiSuccess(await operation(), requestId, status);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof CoupleError) {
      return apiError({
        code: error.code,
        message: error.message,
        recoverable: true,
        requestId,
        status: 409,
      });
    }
    throw error;
  }
};

export const todayFor = async (userId: string) =>
  (await getUserContext(userId)).today;
