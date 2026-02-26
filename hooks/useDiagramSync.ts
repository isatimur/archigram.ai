import { useEffect, useRef } from 'react';
import { Project, User } from '../types.ts';
import { fetchUserDiagrams, upsertUserDiagram } from '../services/supabaseClient.ts';

/**
 * Merge local and cloud project arrays.
 * On id conflict, the project with the higher updatedAt wins.
 * Exported for testing.
 */
export function mergeProjects(local: Project[], cloud: Project[]): Project[] {
  const map = new Map<string, Project>();

  for (const p of cloud) map.set(p.id, p);

  for (const p of local) {
    const existing = map.get(p.id);
    if (!existing || p.updatedAt > existing.updatedAt) {
      map.set(p.id, p);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

interface UseDiagramSyncOptions {
  user: User | null;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
}

/**
 * Syncs localStorage projects with Supabase user_diagrams on sign-in.
 * On every project save, upserts to Supabase in the background (fire-and-forget).
 */
export function useDiagramSync({ user, projects, setProjects }: UseDiagramSyncOptions) {
  const syncedUserIdRef = useRef<string | null>(null);

  // On sign-in: fetch cloud diagrams and merge with local
  useEffect(() => {
    if (!user) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === user.id) return; // already synced this session
    syncedUserIdRef.current = user.id;

    (async () => {
      const cloudProjects = await fetchUserDiagrams(user.id);
      const merged = mergeProjects(projects, cloudProjects);
      setProjects(merged);

      // Upload any local-only projects to cloud
      for (const p of projects) {
        const inCloud = cloudProjects.find((c) => c.id === p.id);
        if (!inCloud || p.updatedAt > (inCloud.updatedAt || 0)) {
          upsertUserDiagram(user.id, p); // fire-and-forget
        }
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Background sync: upsert whenever projects change and user is logged in
  const prevProjectsRef = useRef<Project[]>([]);
  useEffect(() => {
    if (!user) return;
    const prev = prevProjectsRef.current;
    const changed = projects.filter((p) => {
      const old = prev.find((o) => o.id === p.id);
      return !old || p.updatedAt > old.updatedAt;
    });
    for (const p of changed) {
      upsertUserDiagram(user.id, p); // fire-and-forget
    }
    prevProjectsRef.current = projects;
  }, [user, projects]);
}
