import { importHealthAggregatesSchema } from "@moodday/contracts";
import { z } from "zod";
import { healthErrorResponse } from "@/features/v2/health/http-error";
import {
  deleteHealthAggregates,
  importHealthAggregates,
  listHealthAggregates,
} from "@/features/v2/health/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { getFeatureAvailability } from "@/lib/features/availability";
import { authRoute, readAuthRoute, sensitiveAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z
  .object({
    connectionId: z.string().min(8).max(128).optional(),
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .refine((value) => value.from <= value.to, { path: ["to"] })
  .refine(
    (value) =>
      new Date(`${value.to}T00:00:00.000Z`).getTime() -
        new Date(`${value.from}T00:00:00.000Z`).getTime() <=
      366 * 24 * 60 * 60 * 1000,
    { path: ["to"], message: "health_period_too_large" },
  );

const deleteQuerySchema = z
  .object({
    connectionId: z.string().min(8).max(128),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    path: ["to"],
  });

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) =>
    apiSuccess(
      await listHealthAggregates({ userId: ctx.user.id, ...query }),
      getRequestId(request),
    ),
  );

const postHandler = authRoute
  .body(importHealthAggregatesSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    if (!getFeatureAvailability("healthKit").enabled) {
      return apiError({
        code: "healthkit_unavailable",
        message: "La synchronisation Santé est désactivée.",
        recoverable: false,
        requestId,
        status: 403,
      });
    }
    try {
      return apiSuccess(
        await importHealthAggregates(ctx.user.id, body),
        requestId,
      );
    } catch (error) {
      return healthErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

const deleteHandler = sensitiveAuthRoute
  .query(deleteQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await deleteHealthAggregates({ userId: ctx.user.id, ...query }),
        requestId,
      );
    } catch (error) {
      return healthErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
export const DELETE = withApiV2Route(deleteHandler);
