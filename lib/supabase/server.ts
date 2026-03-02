/**
 * Server-side Supabase client for Next.js.
 *
 * Use in Server Components, Route Handlers, and Server Actions.
 * Reads and writes session cookies to keep auth tokens fresh.
 * NEVER import this in 'use client' components.
 */

import { createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in Server Components — acceptable since
            // middleware handles session refresh.
          }
        },
      },
    }
  );
}

// ─── Server-only helper types ─────────────────────────────────────────────────

export type PublicProfile = {
  id: string;
  username: string;
  bio: string | null;
  social_link: string | null;
  avatar_url: string | null;
  created_at: string;
  diagram_count: number;
  total_likes: number;
};

export type PublicDiagram = {
  id: string;
  title: string;
  description: string;
  code: string;
  tags: string[];
  likes: number;
  views: number;
  created_at: string;
};

// ─── Profile queries (Phase 3) ────────────────────────────────────────────────

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, username, bio, social_link, avatar_url, created_at')
    .ilike('username', username)
    .single();

  if (!data) return null;

  const { data: stats } = await supabase
    .from('community_diagrams')
    .select('likes')
    .eq('user_id', data.id);

  return {
    ...data,
    diagram_count: stats?.length ?? 0,
    total_likes: stats?.reduce((sum: number, d: { likes: number }) => sum + (d.likes ?? 0), 0) ?? 0,
  };
}

export async function getUserPublishedDiagrams(
  userId: string,
  limit = 24
): Promise<PublicDiagram[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('community_diagrams')
    .select('id, title, description, code, tags, likes, views, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getServerUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
