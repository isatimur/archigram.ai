import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CommunityDiagram, User } from '../types.ts';

/**
 * Supabase Configuration
 *
 * In production, these values should be set via environment variables.
 * For local development, copy .env.example to .env and fill in your values.
 *
 * IMPORTANT: The anon/public key is safe to expose in client-side code
 * as long as Row Level Security (RLS) is properly configured.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

// Validate configuration - no hardcoded fallbacks for OSS security
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[Supabase] Missing configuration. Community features may not work.');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

// Auth Methods
export const signUp = async (email: string, password: string, username?: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const signInWithOAuth = async (provider: 'github' | 'google') => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/#app`,
      },
    });
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      created_at: user.created_at,
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
};

export interface DbDiagram {
  id: string;
  created_at: string;
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
  likes: number;
  views: number;
}

// Pagination options for cursor-based pagination
export interface PaginationOptions {
  limit?: number;
  cursor?: string; // ID of the last item from previous page
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Helper to handle error objects cleanly in console
const logSupabaseError = (context: string, error: any) => {
  const msg = error?.message || JSON.stringify(error);
  console.warn(`[Supabase] ${context}: ${msg}`);
};

/**
 * Fetch community diagrams with cursor-based pagination.
 *
 * Best Practice: Uses cursor pagination instead of OFFSET for consistent O(1) performance.
 * Requires composite index on (created_at DESC, id DESC) for optimal performance.
 * See supabase-migrations.sql for index creation.
 *
 * @param options Pagination options (limit, cursor)
 * @returns Paginated result with data and next cursor
 */
export const fetchCommunityDiagrams = async (
  options: PaginationOptions = {}
): Promise<PaginatedResult<CommunityDiagram>> => {
  const limit = options.limit || 50; // Default page size

  try {
    let query = supabase
      .from('community_diagrams')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false }) // Secondary sort for stable cursor
      .limit(limit + 1); // Fetch one extra to check if there's more

    // Cursor-based pagination: filter rows before the cursor
    if (options.cursor) {
      // Get the cursor row to determine the boundary
      const { data: cursorData } = await supabase
        .from('community_diagrams')
        .select('created_at, id')
        .eq('id', options.cursor)
        .single();

      if (cursorData) {
        // Filter: created_at < cursor.created_at OR
        //        (created_at = cursor.created_at AND id < cursor.id)
        // This works with the composite index (created_at DESC, id DESC)
        query = query.or(
          `created_at.lt.${cursorData.created_at},and(created_at.eq.${cursorData.created_at},id.lt.${cursorData.id})`
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      logSupabaseError('Fetch failed, falling back to local data', error);
      return { data: [], nextCursor: null, hasMore: false };
    }

    if (!data || data.length === 0) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    // Check if there's more data
    const hasMore = data.length > limit;
    const results = hasMore ? data.slice(0, limit) : data;

    const diagrams = results.map((d: DbDiagram) => ({
      id: d.id,
      title: d.title,
      author: d.author || 'Anonymous',
      description: d.description || '',
      code: d.code,
      likes: d.likes || 0,
      views: d.views || 0,
      tags: d.tags || [],
      createdAt: new Date(d.created_at).toLocaleDateString(),
      createdAtTimestamp: new Date(d.created_at).getTime(),
    }));

    const nextCursor = hasMore ? results[results.length - 1].id : null;

    return {
      data: diagrams,
      nextCursor,
      hasMore,
    };
  } catch (e) {
    logSupabaseError('Client exception', e);
    return { data: [], nextCursor: null, hasMore: false };
  }
};

/**
 * Fetch all community diagrams (backward compatibility).
 * Note: For large datasets, prefer using fetchCommunityDiagrams with pagination.
 */
export const fetchAllCommunityDiagrams = async (): Promise<CommunityDiagram[]> => {
  const result = await fetchCommunityDiagrams({ limit: 1000 });
  return result.data;
};

export const publishDiagram = async (diagram: {
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
}): Promise<boolean> => {
  try {
    const { error } = await supabase.from('community_diagrams').insert([
      {
        title: diagram.title,
        author: diagram.author,
        description: diagram.description,
        code: diagram.code,
        tags: diagram.tags,
        likes: 0,
        views: 0,
      },
    ]);

    if (error) {
      logSupabaseError('Publish failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Publish exception', e);
    return false;
  }
};

export const updateDiagramLikes = async (id: string, count: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('community_diagrams')
      .update({ likes: count })
      .eq('id', id);

    if (error) {
      logSupabaseError('Like update failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Like exception', e);
    return false;
  }
};

/**
 * Increment diagram views atomically.
 *
 * Best Practice: Uses atomic SQL increment to avoid race conditions.
 * The read-then-write pattern can cause lost updates under concurrent load.
 *
 * Note: For even better performance, consider creating a Postgres RPC function:
 * CREATE OR REPLACE FUNCTION increment_diagram_views(diagram_id UUID)
 * RETURNS void AS $$
 * BEGIN
 *   UPDATE community_diagrams
 *   SET views = views + 1
 *   WHERE id = diagram_id;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * @param id Diagram ID
 * @returns Success status
 */
/**
 * Increment diagram views atomically.
 *
 * Best Practice: Uses atomic SQL increment via RPC function to avoid race conditions.
 * The read-then-write pattern can cause lost updates under concurrent load.
 *
 * Note: Requires creating a Postgres RPC function in Supabase:
 * CREATE OR REPLACE FUNCTION increment_diagram_views(diagram_id UUID)
 * RETURNS void AS $$
 * BEGIN
 *   UPDATE community_diagrams
 *   SET views = views + 1
 *   WHERE id = diagram_id;
 * END;
 * $$ LANGUAGE plpgsql;
 *
 * @param id Diagram ID
 * @returns Success status
 */
export const incrementDiagramViews = async (id: string): Promise<boolean> => {
  try {
    // Try RPC function first (most efficient and atomic)
    const { error: rpcError } = await supabase.rpc('increment_diagram_views', { diagram_id: id });

    if (!rpcError) {
      return true;
    }

    // Fallback: Read-then-write (not ideal but works if RPC doesn't exist)
    // TODO: Create the RPC function in Supabase for atomic increments
    const { data, error } = await supabase
      .from('community_diagrams')
      .select('views')
      .eq('id', id)
      .single();

    if (error) {
      logSupabaseError('Fetch views failed', error);
      return false;
    }

    const { error: updateError } = await supabase
      .from('community_diagrams')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      logSupabaseError('Update views failed', updateError);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Increment views exception', e);
    return false;
  }
};
