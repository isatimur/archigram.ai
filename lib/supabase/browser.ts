/**
 * Browser-side Supabase client for Next.js.
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY environment variables.
 * This is the Next.js equivalent of services/supabaseClient.ts (which uses VITE_ vars).
 *
 * All functions here are direct equivalents of those in services/supabaseClient.ts,
 * adapted to the Next.js environment and SSR-safe patterns.
 */

import { createBrowserClient } from '@supabase/ssr';
import type {
  CommunityDiagram,
  Comment,
  User,
  Collection,
  PromptEntry,
  PromptDomain,
  Project,
} from '@/types';

// Read config via import.meta.env shim (populated by DefinePlugin in next.config.ts
// from either NEXT_PUBLIC_SUPABASE_URL or the legacy VITE_SUPABASE_URL env var).
// process.env.NEXT_PUBLIC_* is replaced by Next.js at build time before DefinePlugin
// runs, so it becomes undefined when only VITE_* names exist in Vercel.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined) ||
  '';
const SUPABASE_KEY =
  (import.meta.env.VITE_SUPABASE_KEY as string | undefined) ||
  (process.env.NEXT_PUBLIC_SUPABASE_KEY as string | undefined) ||
  '';

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (!isConfigured) {
  console.warn('[Supabase/browser] Missing configuration. Community features will not work.');
}

export function createClient() {
  if (!isConfigured) {
    throw new Error(
      'Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY'
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
}

// Helper to handle error objects cleanly in console
const logError = (context: string, error: unknown) => {
  const msg = error instanceof Error ? error.message : JSON.stringify(error);
  console.warn(`[Supabase/browser] ${context}: ${msg}`);
};

// ─── Auth ───────────────────────────────────────────────────────────────────

export const signUp = async (email: string, password: string, username?: string) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || email.split('@')[0] } },
    });
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: unknown) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: unknown) {
    return { user: null, error: error instanceof Error ? error.message : String(error) };
  }
};

export const signOut = async () => {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

export const signInWithOAuth = async (provider: 'github' | 'google') => {
  try {
    const supabase = createClient();
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/editor`;
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!isConfigured) return null;
  try {
    const supabase = createClient();
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
  if (!isConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  const supabase = createClient();
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
};

// ─── Profiles ────────────────────────────────────────────────────────────────

export const updateProfile = async (updates: {
  username?: string;
  bio?: string;
  social_link?: string;
}): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    // Update auth metadata (username)
    if (updates.username) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: { username: updates.username },
      });
      if (metaError) {
        logError('Update user metadata failed', metaError);
        return false;
      }
    }

    // Upsert profiles row
    const { error } = await supabase.from('profiles').upsert({
      id: userData.user.id,
      ...(updates.username && { username: updates.username }),
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.social_link !== undefined && { social_link: updates.social_link }),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      logError('Update profile failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logError('Update profile exception', e);
    return false;
  }
};

// ─── Community Diagrams ───────────────────────────────────────────────────────

export type DbDiagram = {
  id: string;
  created_at: string;
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
  likes: number;
  views: number;
};

export type PaginationOptions = {
  limit?: number;
  cursor?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const fetchCommunityDiagrams = async (
  options: PaginationOptions = {}
): Promise<PaginatedResult<CommunityDiagram>> => {
  const limit = options.limit || 50;
  const supabase = createClient();

  try {
    let query = supabase
      .from('community_diagrams')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (options.cursor) {
      const { data: cursorData } = await supabase
        .from('community_diagrams')
        .select('created_at, id')
        .eq('id', options.cursor)
        .single();

      if (cursorData) {
        query = query.or(
          `created_at.lt.${cursorData.created_at},and(created_at.eq.${cursorData.created_at},id.lt.${cursorData.id})`
        );
      }
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return { data: [], nextCursor: null, hasMore: false };
    }

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

    return { data: diagrams, nextCursor: hasMore ? results[results.length - 1].id : null, hasMore };
  } catch (e) {
    logError('Fetch diagrams exception', e);
    return { data: [], nextCursor: null, hasMore: false };
  }
};

export const publishDiagram = async (diagram: {
  title: string;
  author: string;
  description: string;
  code: string;
  tags: string[];
}): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('community_diagrams').insert([
      {
        title: diagram.title,
        author: diagram.author,
        description: diagram.description,
        code: diagram.code,
        tags: diagram.tags,
        likes: 0,
        views: 0,
        user_id: userData.user?.id ?? null,
      },
    ]);
    if (error) {
      logError('Publish failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logError('Publish exception', e);
    return false;
  }
};

export const updateDiagramLikes = async (id: string, count: number): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('community_diagrams')
      .update({ likes: count })
      .eq('id', id);
    if (error) {
      logError('Like update failed', error);
      return false;
    }
    return true;
  } catch (e) {
    logError('Like exception', e);
    return false;
  }
};

export const incrementDiagramViews = async (id: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('increment_diagram_views', { diagram_id: id });
    if (!rpcError) return true;

    const { data, error } = await supabase
      .from('community_diagrams')
      .select('views')
      .eq('id', id)
      .single();
    if (error) return false;

    const { error: updateError } = await supabase
      .from('community_diagrams')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', id);
    return !updateError;
  } catch (e) {
    logError('Increment views exception', e);
    return false;
  }
};

// ─── Comments ────────────────────────────────────────────────────────────────

export const fetchComments = async (diagramId: string): Promise<Comment[]> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('diagram_id', diagramId)
      .order('created_at', { ascending: true });
    if (error) return [];
    return (data || []) as Comment[];
  } catch (e) {
    logError('Fetch comments exception', e);
    return [];
  }
};

export const addComment = async (
  diagramId: string,
  content: string,
  author: string
): Promise<Comment | null> => {
  try {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from('comments')
      .insert({ diagram_id: diagramId, user_id: userData.user.id, author, content })
      .select()
      .single();
    if (error) return null;
    return data as Comment;
  } catch (e) {
    logError('Add comment exception', e);
    return null;
  }
};

export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    return !error;
  } catch (e) {
    logError('Delete comment exception', e);
    return false;
  }
};

// ─── Collections ──────────────────────────────────────────────────────────────

export const fetchCollections = async (): Promise<Collection[]> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return (data || []) as Collection[];
  } catch (e) {
    logError('Fetch collections exception', e);
    return [];
  }
};

// ─── Prompts ──────────────────────────────────────────────────────────────────

export const fetchPrompts = async (options?: {
  domain?: PromptDomain;
  sort?: 'new' | 'top' | 'trending';
  limit?: number;
}): Promise<PromptEntry[]> => {
  const limit = options?.limit || 50;
  try {
    const supabase = createClient();
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
      default:
        query = query.order('created_at', { ascending: false });
    }
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as PromptEntry[];
  } catch (e) {
    logError('Fetch prompts exception', e);
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
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;
    const { error } = await supabase.from('prompts').insert({
      ...prompt,
      user_id: userData.user.id,
    });
    if (error) return false;
    return true;
  } catch (e) {
    logError('Publish prompt exception', e);
    return false;
  }
};

export const updatePromptLikes = async (id: string, count: number): Promise<boolean> => {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('prompts').update({ likes: count }).eq('id', id);
    return !error;
  } catch (e) {
    logError('Prompt like exception', e);
    return false;
  }
};

// ─── User Diagrams (cloud sync) ───────────────────────────────────────────────

export const fetchUserDiagrams = async (userId: string): Promise<Project[]> => {
  if (!userId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_diagrams')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) return [];
    return (data || []).map(
      (d: {
        id: string;
        title: string;
        code: string;
        updated_at: string;
        diagram_type: string;
      }) => ({
        id: d.id,
        name: d.title,
        code: d.code,
        updatedAt: new Date(d.updated_at).getTime(),
        type: (d.diagram_type as 'mermaid' | 'plantuml') || 'mermaid',
      })
    );
  } catch (e) {
    logError('Fetch user diagrams exception', e);
    return [];
  }
};

export const upsertUserDiagram = async (
  userId: string,
  project: Pick<Project, 'id' | 'name' | 'code' | 'updatedAt'> & { type?: string }
): Promise<boolean> => {
  if (!userId || !project.id) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase.from('user_diagrams').upsert({
      id: project.id,
      user_id: userId,
      title: project.name,
      code: project.code,
      diagram_type: project.type || 'mermaid',
      updated_at: new Date(project.updatedAt).toISOString(),
    });
    return !error;
  } catch (e) {
    logError('Upsert user diagram exception', e);
    return false;
  }
};

export const deleteUserDiagram = async (userId: string, diagramId: string): Promise<boolean> => {
  if (!userId || !diagramId) return false;
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('user_diagrams')
      .delete()
      .eq('id', diagramId)
      .eq('user_id', userId);
    return !error;
  } catch (e) {
    logError('Delete user diagram exception', e);
    return false;
  }
};
