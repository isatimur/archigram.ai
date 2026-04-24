import { createBrowserClient } from '@supabase/ssr';

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.VITE_SUPABASE_KEY ?? ''
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Profile queries ──────────────────────────────────────────────────────────

export async function getPublicProfile(username: string): Promise<PublicProfile | null> {
  const supabase = createClient();
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
  const supabase = createClient();
  const { data } = await supabase
    .from('community_diagrams')
    .select('id, title, description, code, tags, likes, views, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getServerUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
