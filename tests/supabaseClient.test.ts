/**
 * Tests for Supabase client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetchResult = { data: [] as unknown[], error: null as { message: string } | null };

const createChain = () => {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  chain.then = (resolve: (v: { data: unknown; error: unknown }) => void) =>
    Promise.resolve(resolve(mockFetchResult));
  return chain;
};

// Extracted to top-level so tests can configure per-test without stale references
const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  getUser: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
};
const mockRpc = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn(() => createChain());

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: mockAuth,
    rpc: mockRpc,
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

  describe('signUp', () => {
    it('should return user object on success', async () => {
      const { signUp } = await import('../services/supabaseClient');

      mockAuth.signUp.mockResolvedValueOnce({
        data: {
          user: { id: 'user-1', email: 'test@example.com', user_metadata: { username: 'tester' } },
          session: null,
        },
        error: null,
      });

      const result = await signUp('test@example.com', 'password123', 'tester');

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { username: 'tester' },
      });
      expect(result.error).toBeNull();
    });

    it('should return error message on failure', async () => {
      const { signUp } = await import('../services/supabaseClient');

      mockAuth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Email already registered'),
      });

      const result = await signUp('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.error).toBe('Email already registered');
    });
  });

  describe('signIn', () => {
    it('should return user object on success', async () => {
      const { signIn } = await import('../services/supabaseClient');

      mockAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: 'user-2', email: 'login@example.com' },
          session: { access_token: 'token' },
        },
        error: null,
      });

      const result = await signIn('login@example.com', 'password123');

      expect(result.user).toEqual({ id: 'user-2', email: 'login@example.com' });
      expect(result.error).toBeNull();
    });

    it('should return error message on failure', async () => {
      const { signIn } = await import('../services/supabaseClient');

      mockAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      const result = await signIn('login@example.com', 'wrong-password');

      expect(result.user).toBeNull();
      expect(result.error).toBe('Invalid login credentials');
    });
  });

  describe('signOut', () => {
    it('should return null error on success', async () => {
      const { signOut } = await import('../services/supabaseClient');

      mockAuth.signOut.mockResolvedValueOnce({ error: null });

      const result = await signOut();

      expect(result.error).toBeNull();
    });

    it('should return error message on failure', async () => {
      const { signOut } = await import('../services/supabaseClient');

      mockAuth.signOut.mockResolvedValueOnce({
        error: new Error('Session expired'),
      });

      const result = await signOut();

      expect(result.error).toBe('Session expired');
    });
  });

  describe('fetchPrompts', () => {
    it('should return array of prompts on success', async () => {
      mockFetchResult.data = [
        {
          id: 'p1',
          title: 'Healthcare Flow',
          author: 'DocUser',
          description: 'A healthcare diagram prompt',
          prompt_text: 'Create a patient flow',
          domain: 'healthcare',
          tags: ['healthcare', 'flow'],
          likes: 10,
          views: 100,
          created_at: '2024-06-01T00:00:00Z',
        },
        {
          id: 'p2',
          title: 'CI/CD Pipeline',
          author: 'DevUser',
          description: 'A DevOps prompt',
          prompt_text: 'Create a CI/CD pipeline',
          domain: 'devops',
          tags: ['devops', 'ci'],
          likes: 25,
          views: 200,
          created_at: '2024-07-01T00:00:00Z',
        },
      ];
      mockFetchResult.error = null;

      const { fetchPrompts } = await import('../services/supabaseClient');
      const result = await fetchPrompts();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'p1', title: 'Healthcare Flow', domain: 'healthcare' });
      expect(result[1]).toMatchObject({ id: 'p2', title: 'CI/CD Pipeline', domain: 'devops' });
    });

    it('should return empty array on error', async () => {
      mockFetchResult.error = { message: 'Prompts table not found' };

      const { fetchPrompts } = await import('../services/supabaseClient');
      const result = await fetchPrompts();

      expect(result).toEqual([]);
    });

    it('should accept domain and sort options', async () => {
      mockFetchResult.data = [
        {
          id: 'p3',
          title: 'Finance Report',
          author: 'FinUser',
          description: 'Financial diagram',
          prompt_text: 'Create a finance flow',
          domain: 'finance',
          tags: ['finance'],
          likes: 50,
          views: 500,
          created_at: '2024-08-01T00:00:00Z',
        },
      ];
      mockFetchResult.error = null;

      const { fetchPrompts } = await import('../services/supabaseClient');
      const result = await fetchPrompts({ domain: 'healthcare', sort: 'top' });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });
  });

  describe('addComment', () => {
    it('should return comment when authenticated', async () => {
      const { addComment } = await import('../services/supabaseClient');

      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'test@example.com' } },
        error: null,
      });

      const mockComment = {
        id: 'comment-1',
        diagram_id: 'diagram-1',
        user_id: 'user-1',
        author: 'TestUser',
        content: 'Great diagram!',
        created_at: '2024-06-15T12:00:00Z',
      };

      const chain = createChain();
      chain.single = vi.fn().mockResolvedValue({ data: mockComment, error: null });
      mockFrom.mockReturnValueOnce(chain);

      const result = await addComment('diagram-1', 'Great diagram!', 'TestUser');

      expect(result).toEqual(mockComment);
    });

    it('should return null when not authenticated', async () => {
      const { addComment } = await import('../services/supabaseClient');

      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await addComment('diagram-1', 'Nice work!', 'AnonUser');

      expect(result).toBeNull();
    });
  });

  describe('deleteComment', () => {
    it('should return true on success', async () => {
      mockFetchResult.error = null;

      const { deleteComment } = await import('../services/supabaseClient');
      const result = await deleteComment('comment-1');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockFetchResult.error = { message: 'Permission denied' };

      const { deleteComment } = await import('../services/supabaseClient');
      const result = await deleteComment('comment-1');

      expect(result).toBe(false);
    });
  });

  describe('fetchCollections', () => {
    it('should return array of collections on success', async () => {
      mockFetchResult.data = [
        {
          id: 'col-1',
          title: 'Best Architecture Diagrams',
          slug: 'best-architecture',
          description: 'Curated collection of top diagrams',
          curator: 'admin',
          created_at: '2024-05-01T00:00:00Z',
        },
        {
          id: 'col-2',
          title: 'Healthcare Workflows',
          slug: 'healthcare-workflows',
          description: 'HIPAA-compliant diagram collection',
          cover_image_url: 'https://example.com/cover.png',
          curator: 'DocUser',
          created_at: '2024-06-01T00:00:00Z',
        },
      ];
      mockFetchResult.error = null;

      const { fetchCollections } = await import('../services/supabaseClient');
      const result = await fetchCollections();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'col-1',
        title: 'Best Architecture Diagrams',
        slug: 'best-architecture',
      });
      expect(result[1]).toMatchObject({
        id: 'col-2',
        title: 'Healthcare Workflows',
        curator: 'DocUser',
      });
    });

    it('should return empty array on error', async () => {
      mockFetchResult.error = { message: 'Collections table not found' };

      const { fetchCollections } = await import('../services/supabaseClient');
      const result = await fetchCollections();

      expect(result).toEqual([]);
    });
  });

  describe('incrementDiagramViews fallback', () => {
    it('should fall back to read-then-write when RPC fails', async () => {
      const { incrementDiagramViews } = await import('../services/supabaseClient');

      // Make RPC fail so the fallback path is triggered
      mockRpc.mockResolvedValueOnce({ error: { message: 'Function not found' } });

      // The fallback does:
      //   1. supabase.from('community_diagrams').select('views').eq('id', id).single()
      //   2. supabase.from('community_diagrams').update({ views: currentViews + 1 }).eq('id', id)
      //
      // First .from() call: select chain ending in .single() returning views data
      const selectChain = createChain();
      selectChain.single = vi.fn().mockResolvedValue({ data: { views: 42 }, error: null });
      // Second .from() call: update chain resolving with no error
      const updateChain = createChain();

      mockFrom.mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain);

      const result = await incrementDiagramViews('diagram-fallback');

      expect(result).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('increment_diagram_views', {
        diagram_id: 'diagram-fallback',
      });
    });

    it('should return false when fallback select fails', async () => {
      const { incrementDiagramViews } = await import('../services/supabaseClient');

      // Make RPC fail
      mockRpc.mockResolvedValueOnce({ error: { message: 'Function not found' } });

      // Fallback select also fails
      const selectChain = createChain();
      selectChain.single = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });

      mockFrom.mockReturnValueOnce(selectChain);

      const result = await incrementDiagramViews('nonexistent-diagram');

      expect(result).toBe(false);
    });
  });
});
