import { Logger } from "tslog";

export const logger = new Logger(
  {
    name: "AppLogger",
    type: process.env.NODE_ENV === "production" ? "json" : "pretty",
    // Don't use `env` here, because we can use the logger in the browser
    minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
    maskPlaceholder: "[redacted]",
    maskValuesOfKeysCaseInsensitive: true,
    maskValuesOfKeys: [
      "password",
      "token",
      "secret",
      "authorization",
      "cookie",
      "email",
      "to",
      "subject",
      "payload",
      "body",
      "note",
      "notes",
      "prompt",
      "output",
      "url",
      "endpoint",
      "userId",
      "patientId",
      "caregiverId",
    ],
    maskValuesRegEx: [
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+\b/gi,
    ],
  },
  {
    release:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "local",
  },
);
