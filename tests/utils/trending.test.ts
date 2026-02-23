import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trendingScore } from '../../utils/trending';

describe('trendingScore', () => {
  const NOW = 1_700_000_000_000;

  function msAgo(hours: number): number {
    return NOW - hours * 3_600_000;
  }

  // Pin Date.now() so tests are deterministic
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns higher score for more likes (same views and timestamp)', () => {
    const ts = msAgo(100);
    const scoreLow = trendingScore(5, 200, ts);
    const scoreHigh = trendingScore(50, 200, ts);
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('returns higher score for more views (same likes and timestamp)', () => {
    const ts = msAgo(100);
    const scoreLow = trendingScore(10, 100, ts);
    const scoreHigh = trendingScore(10, 500, ts);
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('returns higher score for more recent items (same likes and views)', () => {
    const scoreOlder = trendingScore(10, 100, msAgo(400));
    const scoreNewer = trendingScore(10, 100, msAgo(50));
    expect(scoreNewer).toBeGreaterThan(scoreOlder);
  });

  it('recency bonus is 0 for items older than 500 hours', () => {
    const ts600 = msAgo(600);
    const ts500 = msAgo(500);

    // With zero likes and views the score equals the recency bonus alone
    expect(trendingScore(0, 0, ts600)).toBe(0);
    expect(trendingScore(0, 0, ts500)).toBe(0);
  });

  it('recency bonus is capped at 1000 for brand-new items', () => {
    // createdAtMs = Date.now() => ageHours = 0 => recencyBonus = 1000
    const score = trendingScore(0, 0, NOW);
    expect(score).toBe(1000);
  });

  it('works with zero likes and views', () => {
    const score = trendingScore(0, 0, msAgo(200));
    // recencyBonus = max(0, 1000 - 200*2) = 600
    expect(score).toBe(600);
  });
});
