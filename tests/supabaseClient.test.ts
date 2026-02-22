/**
 * Tests for Supabase client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetchResult = { data: [] as unknown[], error: null as { message: string } | null };

const createChain = () => {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.then = (resolve: (v: { data: unknown; error: unknown }) => void) =>
    Promise.resolve(resolve(mockFetchResult));
  return chain;
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => createChain()),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    rpc: vi.fn().mockResolvedValue({ error: null }),
  })),
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetchResult.data = [];
    mockFetchResult.error = null;
  });

  describe('fetchCommunityDiagrams', () => {
    it('should return paginated result with correct shape', async () => {
      mockFetchResult.data = [
        {
          id: '1',
          created_at: '2024-01-01T00:00:00Z',
          title: 'Test Diagram',
          author: 'Test Author',
          description: 'Test',
          code: 'graph TD',
          likes: 5,
          views: 10,
          tags: ['architecture'],
        },
      ];

      const { fetchCommunityDiagrams } = await import('../services/supabaseClient');
      const result = await fetchCommunityDiagrams({ limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: '1',
        title: 'Test Diagram',
        author: 'Test Author',
        code: 'graph TD',
        likes: 5,
        views: 10,
        tags: ['architecture'],
      });
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result).toHaveProperty('nextCursor');
      expect(result).toHaveProperty('hasMore');
    });

    it('should return empty result on error', async () => {
      mockFetchResult.error = { message: 'Database error' };

      const { fetchCommunityDiagrams } = await import('../services/supabaseClient');
      const result = await fetchCommunityDiagrams();

      expect(result.data).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.hasMore).toBe(false);
    });
  });

  describe('publishDiagram', () => {
    it('should return boolean result', async () => {
      const { publishDiagram } = await import('../services/supabaseClient');
      const result = await publishDiagram({
        title: 'My Diagram',
        author: 'Me',
        description: 'Test',
        code: 'graph TD',
        tags: ['test'],
      });

      expect(typeof result).toBe('boolean');
    });
  });

  describe('updateDiagramLikes', () => {
    it('should return true on success', async () => {
      const { updateDiagramLikes } = await import('../services/supabaseClient');
      const result = await updateDiagramLikes('diagram-id', 10);
      expect(result).toBe(true);
    });
  });

  describe('incrementDiagramViews', () => {
    it('should return true when RPC succeeds', async () => {
      const { incrementDiagramViews } = await import('../services/supabaseClient');
      const result = await incrementDiagramViews('diagram-id');
      expect(result).toBe(true);
    });
  });

  describe('fetchAllCommunityDiagrams', () => {
    it('should return array from fetchCommunityDiagrams data', async () => {
      mockFetchResult.data = [
        {
          id: '1',
          created_at: '2024-01-01T00:00:00Z',
          title: 'D1',
          author: 'A',
          description: '',
          code: 'graph TD',
          likes: 0,
          views: 0,
          tags: [],
        },
      ];
      mockFetchResult.error = null;

      const { fetchAllCommunityDiagrams } = await import('../services/supabaseClient');
      const result = await fetchAllCommunityDiagrams();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('title', 'D1');
    });
  });
});
