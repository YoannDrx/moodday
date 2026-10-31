import { NextResponse } from "next/server";
import { isBodyWithinBudget } from "./mutation-budget";

export const getRequestId = (request: Request) =>
  request.headers.get("x-request-id") ?? crypto.randomUUID();

export const apiSuccess = <T>(data: T, requestId: string, status = 200) =>
  NextResponse.json(
    { data, requestId },
    { status, headers: { "x-request-id": requestId } },
  );

export const apiError = ({
  code,
  message,
  recoverable,
  requestId,
  status,
  validationError,
}: {
  code: string;
  message: string;
  recoverable: boolean;
  requestId: string;
  status: number;
  validationError?: { flatten: () => { fieldErrors: unknown } };
}) =>
  NextResponse.json(
    {
      error: {
        code,
        message,
        recoverable,
        requestId,
        ...(validationError
          ? { fieldErrors: validationError.flatten().fieldErrors }
          : {}),
      },
    },
    { status, headers: { "x-request-id": requestId } },
  );

type ApiRouteHandler<Arguments extends unknown[]> = (
  ...arguments_: Arguments
) => Response | Promise<Response>;

/**
 * next-zod-route validates before entering the handler and returns its own
 * legacy error body. Keep the validator as the single route boundary, then
 * normalize every non-V2 response for shared web/native clients.
 */
export const withApiV2Route =
  <Arguments extends [Request, ...unknown[]]>(
    handler: ApiRouteHandler<Arguments>,
  ) =>
  async (...arguments_: Arguments) => {
    if (
      !["GET", "HEAD"].includes(arguments_[0].method) &&
      !(await isBodyWithinBudget(arguments_[0]))
    ) {
      return apiError({
        code: "payload_too_large",
        message: "La requête dépasse la taille autorisée.",
        recoverable: false,
        requestId: getRequestId(arguments_[0]),
        status: 413,
      });
    }
    const response = await handler(...arguments_);
    if (response.ok) return response;

    let body: unknown;
    try {
      body = (await response.clone().json()) as unknown;
    } catch {
      body = null;
    }
    if (body && typeof body === "object" && "error" in body) return response;

    const requestId = getRequestId(arguments_[0]);
    const status = response.status;
    const invalidRequest = status === 400;
    const authenticationRequired = status === 401;
    const recentAuthenticationRequired =
      status === 403 &&
      body !== null &&
      typeof body === "object" &&
      "message" in body &&
      body.message === "Recent authentication required";

    const normalized = apiError({
      code:
        status === 429
          ? "rate_limited"
          : invalidRequest
            ? "invalid_request"
            : authenticationRequired
              ? "authentication_required"
              : recentAuthenticationRequired
                ? "recent_authentication_required"
                : status === 403
                  ? "access_denied"
                  : "unexpected_server_error",
      message:
        status === 429
          ? "Trop de requêtes. Réessaie dans un instant."
          : invalidRequest
            ? "La requête contient des données invalides."
            : authenticationRequired
              ? "Une connexion vérifiée est nécessaire."
              : recentAuthenticationRequired
                ? "Reconnecte-toi avant cette action sensible."
                : status === 403
                  ? "Cette action n’est pas autorisée."
                  : "Le service est momentanément indisponible.",
      recoverable: status < 500,
      requestId,
      status,
    });
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) normalized.headers.set("Retry-After", retryAfter);
    return normalized;
  };
