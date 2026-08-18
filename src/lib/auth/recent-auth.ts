export const RECENT_AUTHENTICATION_WINDOW_MS = 10 * 60 * 1000;

export const hasRecentAuthentication = (
  session:
    | { session?: { createdAt?: Date | string | null } | null }
    | null
    | undefined,
  now = Date.now(),
) => {
  const createdAt = session?.session?.createdAt
    ? new Date(session.session.createdAt).getTime()
    : Number.NaN;

  return (
    Number.isFinite(createdAt) &&
    now - createdAt < RECENT_AUTHENTICATION_WINDOW_MS
  );
};
