import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CommunityDiagram,
  Comment,
  User,
  Collection,
  PromptEntry,
  PromptDomain,
  Project,
} from '../types.ts';

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
  } catch (error: unknown) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
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
  } catch (error: unknown) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
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
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
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

export const sendWelcomeEmail = async (email: string, username: string) => {
  try {
    await fetch('/api/welcome-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username }),
    });
  } catch {
    // Fire-and-forget — don't block auth flow
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.email) {
      const welcomeKey = `archigram_welcome_sent_${session.user.id}`;
      if (!localStorage.getItem(welcomeKey)) {
        localStorage.setItem(welcomeKey, '1');
        sendWelcomeEmail(
          session.user.email,
          session.user.user_metadata?.full_name || session.user.email.split('@')[0]
        );
      }
    }
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
const logSupabaseError = (context: string, error: unknown) => {
  const msg = error instanceof Error ? error.message : JSON.stringify(error);
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

// --- Comment CRUD ---

export const fetchComments = async (diagramId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('created_at', { ascending: true });

    if (error) {
      logSupabaseError('Fetch comments failed', error);
      return [];
    }

    return (data || []) as Comment[];
  } catch (e) {
    logSupabaseError('Fetch comments exception', e);
    return [];
  }
};

export const fetchCommentCounts = async (diagramIds: string[]): Promise<Record<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('diagram_id')
      .in('diagram_id', diagramIds);

    if (error) {
      logSupabaseError('Fetch comment counts failed', error);
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.diagram_id] = (counts[row.diagram_id] || 0) + 1;
    }
    return counts;
  } catch (e) {
    logSupabaseError('Fetch comment counts exception', e);
    return {};
  }
};

export const addComment = async (
  diagramId: string,
  content: string,
  author: string
): Promise<Comment | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      logSupabaseError('Add comment', 'User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        diagram_id: diagramId,
        user_id: userData.user.id,
        author,
        content,
      })
      .select()
      .single();

    if (error) {
      logSupabaseError('Add comment failed', error);
      return null;
    }

    return data as Comment;
  } catch (e) {
    logSupabaseError('Add comment exception', e);
    return null;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      logSupabaseError('Delete comment failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Delete comment exception', e);
    return false;
  }
};

// --- Collections CRUD ---

export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logSupabaseError('Fetch collections failed', error);
      return [];
    }

    return (data || []) as Collection[];
  } catch (e) {
    logSupabaseError('Fetch collections exception', e);
    return [];
  }
};

export const fetchCollectionBySlug = async (slug: string): Promise<Collection | null> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      logSupabaseError('Fetch collection by slug failed', error);
      return null;
    }

    return data as Collection;
  } catch (e) {
    logSupabaseError('Fetch collection by slug exception', e);
    return null;
  }
};

export const fetchCollectionItems = async (collectionId: string): Promise<CommunityDiagram[]> => {
  try {
    const { data, error } = await supabase
      .from('collection_items')
      .select('position, diagram_id, community_diagrams(*)')
      .eq('collection_id', collectionId)
      .order('position', { ascending: true });

    if (error) {
      logSupabaseError('Fetch collection items failed', error);
      return [];
    }

    return (data || [])
      .filter((item: Record<string, unknown>) => item.community_diagrams)
      .map((item: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = item.community_diagrams as any;
        return {
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
        } as CommunityDiagram;
      });
  } catch (e) {
    logSupabaseError('Fetch collection items exception', e);
    return [];
  }
};

// --- Prompts CRUD ---

export const fetchPrompts = async (options?: {
  domain?: PromptDomain;
  sort?: 'new' | 'top' | 'trending';
  limit?: number;
}): Promise<PromptEntry[]> => {
  const limit = options?.limit || 50;

  try {
    let query = supabase.from('prompts').select('*').limit(limit);

    if (options?.domain && options.domain !== 'general') {
      query = query.eq('domain', options.domain);
    }

    switch (options?.sort) {
      case 'top':
        query = query.order('likes', { ascending: false });
        break;
      case 'trending':
        query = query.order('views', { ascending: false });
        break;
      case 'new':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      logSupabaseError('Fetch prompts failed', error);
      return [];
    }

    return (data || []) as PromptEntry[];
  } catch (e) {
    logSupabaseError('Fetch prompts exception', e);
    return [];
  }
};

export const publishPrompt = async (prompt: {
  title: string;
  author: string;
  description: string;
  prompt_text: string;
  domain: PromptDomain;
  tags: string[];
  result_diagram_code?: string;
}): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      logSupabaseError('Publish prompt', 'User not authenticated');
      return false;
    }

    const { error } = await supabase.from('prompts').insert({
      title: prompt.title,
      author: prompt.author,
      description: prompt.description,
      prompt_text: prompt.prompt_text,
      domain: prompt.domain,
      tags: prompt.tags,
      result_diagram_code: prompt.result_diagram_code,
      user_id: userData.user.id,
    });

    if (error) {
      logSupabaseError('Publish prompt failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Publish prompt exception', e);
    return false;
  }
};

export const updatePromptLikes = async (id: string, count: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from('prompts').update({ likes: count }).eq('id', id);

    if (error) {
      logSupabaseError('Prompt like update failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Prompt like exception', e);
    return false;
  }
};

// --- User Diagrams (cloud sync) ---

export type UserDiagramRow = {
  id: string;
  user_id: string;
  title: string;
  code: string;
  diagram_type: string;
  updated_at: string;
};

export const fetchUserDiagrams = async (userId: string): Promise<Project[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_diagrams')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      logSupabaseError('Fetch user diagrams failed', error);
      return [];
    }

    return (data || []).map((d: UserDiagramRow) => ({
      id: d.id,
      name: d.title,
      code: d.code,
      updatedAt: new Date(d.updated_at).getTime(),
      type: (d.diagram_type as 'mermaid' | 'plantuml') || 'mermaid',
    }));
  } catch (e) {
    logSupabaseError('Fetch user diagrams exception', e);
    return [];
  }
};

export const upsertUserDiagram = async (
  userId: string,
  project: Pick<Project, 'id' | 'name' | 'code' | 'updatedAt'> & { type?: string }
): Promise<boolean> => {
  if (!userId || !project.id) return false;
  try {
    const { error } = await supabase.from('user_diagrams').upsert({
      id: project.id,
      user_id: userId,
      title: project.name,
      code: project.code,
      diagram_type: project.type || 'mermaid',
      updated_at: new Date(project.updatedAt).toISOString(),
    });

    if (error) {
      logSupabaseError('Upsert user diagram failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Upsert user diagram exception', e);
    return false;
  }
};

export const deleteUserDiagram = async (userId: string, diagramId: string): Promise<boolean> => {
  if (!userId || !diagramId) return false;
  try {
    const { error } = await supabase
      .from('user_diagrams')
      .delete()
      .eq('id', diagramId)
      .eq('user_id', userId);

    if (error) {
      logSupabaseError('Delete user diagram failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logSupabaseError('Delete user diagram exception', e);
    return false;
  }
};
