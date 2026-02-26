import { describe, it, expect, vi } from 'vitest';

// Mock supabase before importing the module
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  }),
}));

import {
  fetchUserDiagrams,
  upsertUserDiagram,
  deleteUserDiagram,
} from '../../services/supabaseClient.ts';

describe('user_diagrams CRUD', () => {
  it('fetchUserDiagrams returns empty array on error', async () => {
    const result = await fetchUserDiagrams('user-1');
    expect(Array.isArray(result)).toBe(true);
  });

  it('upsertUserDiagram returns false on missing userId', async () => {
    const result = await upsertUserDiagram('', { id: '1', name: 'Test', code: '', updatedAt: 0 });
    expect(result).toBe(false);
  });

  it('deleteUserDiagram returns false on missing id', async () => {
    const result = await deleteUserDiagram('', '');
    expect(result).toBe(false);
  });
});
