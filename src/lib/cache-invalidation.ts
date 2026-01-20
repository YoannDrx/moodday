import { logger } from "./logger";
import { redisClient } from "./redis";
import { CacheKeys } from "./redis-keys";

export async function invalidateUserOrgsCache(userId: string) {
  try {
    await redisClient.del(CacheKeys.userOrgs(userId));
  } catch (error) {
    logger.error("[Cache] Failed to invalidate user orgs:", error);
  }
}

export async function invalidateOrgMemberCache(
  orgSlug: string,
  userId: string,
) {
  try {
    await redisClient.del(CacheKeys.orgMember(orgSlug, userId));
  } catch (error) {
    logger.error("[Cache] Failed to invalidate org member:", error);
  }
}

export async function invalidateAllUserCaches(userId: string) {
  try {
    await redisClient.del(CacheKeys.userOrgs(userId));

    const pattern = `org:*:member:${userId}`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error("[Cache] Failed to invalidate all user caches:", error);
  }
}

export async function invalidateOrgSlugCache(slug: string) {
  try {
    await redisClient.del(CacheKeys.orgBySlug(slug));
  } catch (error) {
    logger.error("[Cache] Failed to invalidate org slug:", error);
  }
}

export async function invalidateAllOrgMemberCaches(orgSlug: string) {
  try {
    const pattern = `org:${orgSlug}:member:*`;
    const keys = await redisClient.keys(pattern);

    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error("[Cache] Failed to invalidate org member caches:", error);
  }
}

export async function invalidateOrgSubscription(orgId: string) {
  try {
    await redisClient.del(CacheKeys.orgSubscription(orgId));
  } catch (error) {
    logger.error("[Cache] Failed to invalidate org subscription:", error);
  }
}
