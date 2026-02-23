/**
 * Unified trending score algorithm used by CommunityGallery and PromptMarketplace.
 * Higher score = more trending. Combines engagement metrics with recency bonus.
 */
export const trendingScore = (likes: number, views: number, createdAtMs: number): number => {
  const ageHours = (Date.now() - createdAtMs) / 3_600_000;
  const recencyBonus = Math.max(0, 1000 - ageHours * 2);
  return likes * 10 + views * 0.5 + recencyBonus;
};
