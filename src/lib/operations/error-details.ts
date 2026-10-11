const PRISMA_ERROR_CODE = /^P\d{4}$/;

/**
 * Error fields safe to log for unexpected failures: the error class plus the
 * Prisma code (for example P2022 for schema drift) when one is present. The
 * message is deliberately excluded because it can quote user data.
 */
export const getOperationalErrorDetails = (error: unknown) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;

  return {
    errorCode:
      error instanceof Error && error.name ? error.name : "unknown_error",
    ...(typeof code === "string" && PRISMA_ERROR_CODE.test(code)
      ? { prismaCode: code }
      : {}),
  };
};
