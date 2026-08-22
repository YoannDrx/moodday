import { moodDayV2OpenApi } from "@moodday/contracts/openapi";
import { NextResponse } from "next/server";

export const GET = () =>
  NextResponse.json(moodDayV2OpenApi, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
