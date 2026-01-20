export const CacheKeys = {
  userOrgs: (userId: string) => `user:${userId}:orgs`,
  userFirstOrg: (userId: string) => `user:${userId}:first-org`,
  orgMember: (orgSlug: string, userId: string) =>
    `org:${orgSlug}:member:${userId}`,
  orgBySlug: (slug: string) => `org:slug:${slug}`,
  sessionData: (sessionId: string) => `session:${sessionId}`,
  orgSubscription: (orgId: string) => `org:${orgId}:subscription`,
} as const;

export const CacheTTL = {
  USER_ORGS: 60 * 10, // 10 minutes
  ORG_MEMBER: 60 * 5, // 5 minutes
  ORG_SLUG: 60 * 30, // 30 minutes
  SESSION_DATA: 60 * 15, // 15 minutes
  ORG_SUBSCRIPTION: 60 * 60, // 1 hour
} as const;
