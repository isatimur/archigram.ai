# Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up user authentication end-to-end — cloud sync for diagrams, auth-gating for social actions, and a profile page.

**Architecture:** Incremental wiring on top of existing Supabase auth infrastructure. A new `useDiagramSync` hook handles localStorage↔Supabase sync. A `requireAuth` utility in App.tsx gates social actions. A new `ProfilePage` component serves the `#profile` route.

**Tech Stack:** React 19, TypeScript, Supabase JS v2, Tailwind CSS, Vitest, Lucide icons

---

### Task 1: Add `'profile'` to AppView type and router

**Files:**

- Modify: `types.ts:73-83`
- Modify: `hooks/useAppRouter.ts:5-17`

**Step 1: Update `AppView` in `types.ts`**

Find the `AppView` type (line 73) and add `'profile'`:

```ts
export type AppView =
  | 'landing'
  | 'app'
  | 'plantuml'
  | 'docs'
  | 'gallery'
  | 'discover'
  | 'prompts'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'license'
  | 'profile';
```

**Step 2: Add `'profile'` to `VALID_VIEWS` in `hooks/useAppRouter.ts`**

```ts
const VALID_VIEWS = new Set<AppView>([
  'landing',
  'app',
  'plantuml',
  'docs',
  'gallery',
  'discover',
  'prompts',
  'faq',
  'privacy',
  'terms',
  'license',
  'profile',
]);
```

**Step 3: Type-check**

```bash
bun run type-check
```

Expected: 0 errors

**Step 4: Commit**

```bash
git add types.ts hooks/useAppRouter.ts
git commit -m "feat(auth): add profile route to AppView and router"
```

---

### Task 2: Add `user_diagrams` CRUD to `supabaseClient.ts`

**Files:**

- Modify: `services/supabaseClient.ts` (append after existing exports)

**Step 1: Write a failing test**

Create `tests/services/userDiagrams.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
```

**Step 2: Run test to verify it fails**

```bash
bunx vitest run tests/services/userDiagrams.test.ts
```

Expected: FAIL — `fetchUserDiagrams`, `upsertUserDiagram`, `deleteUserDiagram` not exported

**Step 3: Add CRUD functions to `services/supabaseClient.ts`**

Append at the end of the file:

```ts
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
```

Note: Also add `Project` to the import at top of `supabaseClient.ts`:

```ts
import {
  CommunityDiagram,
  Comment,
  User,
  Collection,
  PromptEntry,
  PromptDomain,
  Project,
} from '../types.ts';
```

**Step 4: Run test to verify it passes**

```bash
bunx vitest run tests/services/userDiagrams.test.ts
```

Expected: 3 passing

**Step 5: Run full test suite**

```bash
bun run test:run
```

Expected: all tests pass

**Step 6: Commit**

```bash
git add services/supabaseClient.ts tests/services/userDiagrams.test.ts
git commit -m "feat(auth): add user_diagrams CRUD to supabaseClient"
```

---

### Task 3: Create `useDiagramSync` hook

**Files:**

- Create: `hooks/useDiagramSync.ts`
- Create: `tests/hooks/useDiagramSync.test.ts`

**Step 1: Write failing tests**

Create `tests/hooks/useDiagramSync.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { mergeProjects } from '../../hooks/useDiagramSync.ts';
import type { Project } from '../../types.ts';

describe('mergeProjects', () => {
  it('returns local projects when cloud is empty', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'x', updatedAt: 1000 }];
    const result = mergeProjects(local, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns cloud projects when local is empty', () => {
    const cloud: Project[] = [{ id: '2', name: 'B', code: 'y', updatedAt: 2000 }];
    const result = mergeProjects([], cloud);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('prefers newer updatedAt on conflict', () => {
    const local: Project[] = [{ id: '1', name: 'local', code: 'local', updatedAt: 3000 }];
    const cloud: Project[] = [{ id: '1', name: 'cloud', code: 'cloud', updatedAt: 1000 }];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('local'); // local is newer
  });

  it('deduplicates by id', () => {
    const local: Project[] = [{ id: '1', name: 'A', code: 'a', updatedAt: 1000 }];
    const cloud: Project[] = [
      { id: '1', name: 'A-cloud', code: 'a', updatedAt: 500 },
      { id: '2', name: 'B', code: 'b', updatedAt: 2000 },
    ];
    const result = mergeProjects(local, cloud);
    expect(result).toHaveLength(2);
  });
});
```

**Step 2: Run to verify it fails**

```bash
bunx vitest run tests/hooks/useDiagramSync.test.ts
```

Expected: FAIL — `mergeProjects` not exported

**Step 3: Create `hooks/useDiagramSync.ts`**

```ts
import { useEffect, useRef } from 'react';
import { Project } from '../types.ts';
import { User } from '../types.ts';
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
```

**Step 4: Run tests to verify they pass**

```bash
bunx vitest run tests/hooks/useDiagramSync.test.ts
```

Expected: 4 passing

**Step 5: Type-check**

```bash
bun run type-check
```

Expected: 0 errors

**Step 6: Commit**

```bash
git add hooks/useDiagramSync.ts tests/hooks/useDiagramSync.test.ts
git commit -m "feat(auth): add useDiagramSync hook with merge logic"
```

---

### Task 4: Wire `useDiagramSync` into `App.tsx`

**Files:**

- Modify: `App.tsx`
- Modify: `hooks/useProjects.ts` (expose `setProjects`)

**Step 1: Expose `setProjects` from `useProjects`**

In `hooks/useProjects.ts`, find the return statement and add `setProjects` to the returned object:

```ts
return {
  projects,
  setProjects, // ← add this
  activeProjectId,
  // ... rest unchanged
};
```

**Step 2: Import and wire `useDiagramSync` in `App.tsx`**

Add import at top of `App.tsx`:

```ts
import { useDiagramSync } from './hooks/useDiagramSync.ts';
```

In the body of `App`, after the `useProjects` destructure (around line 184), add:

```ts
const { setProjects } = useProjects(...); // already destructured — just add setProjects

useDiagramSync({ user, projects, setProjects });
```

**Step 3: Type-check**

```bash
bun run type-check
```

Expected: 0 errors

**Step 4: Run tests**

```bash
bun run test:run
```

Expected: all pass

**Step 5: Commit**

```bash
git add App.tsx hooks/useProjects.ts
git commit -m "feat(auth): wire useDiagramSync into App"
```

---

### Task 5: Add `requireAuth` utility and gate social actions

**Files:**

- Modify: `App.tsx`
- Modify: `components/CommunityGallery.tsx`
- Modify: `components/PromptMarketplace.tsx`

**Step 1: Add `requireAuth` and `pendingAction` to `App.tsx`**

After the auth state declarations (around line 138–139 in App.tsx), add:

```ts
const pendingAction = useRef<(() => void) | null>(null);

const requireAuth = (action: () => void) => {
  if (user) {
    action();
  } else {
    pendingAction.current = action;
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  }
};
```

Add `useRef` to the React import if not already there.

**Step 2: Run pending action on auth success**

Find the `onAuthSuccess` handler in App.tsx (around line 835):

```tsx
onAuthSuccess={(u) => {
  setUser(u);
  setIsAuthModalOpen(false);
  if (pendingAction.current) {
    pendingAction.current();
    pendingAction.current = null;
  }
}}
```

**Step 3: Gate `openPublishModal` in App.tsx**

Find `openPublishModal` (around line 328) and wrap the body:

```ts
const openPublishModal = () => {
  requireAuth(() => {
    const activeP = projects.find((p) => p.id === activeProjectId);
    setPublishData({
      title: activeP?.name || '',
      author: localStorage.getItem(AUTHOR_KEY) || '',
      description: '',
      tags: '',
    });
    setIsPublishModalOpen(true);
  });
};
```

**Step 4: Pass `requireAuth` to `CommunityGallery` and `PromptMarketplace`**

Add `onRequireAuth` prop to the gallery and marketplace component calls in App.tsx JSX:

```tsx
<CommunityGallery
  user={user}
  onOpenAuth={() => { setAuthModalMode('signin'); setIsAuthModalOpen(true); }}
  onRequireAuth={requireAuth}
  ...
/>
```

**Step 5: Gate `handleLike` in `CommunityGallery.tsx`**

Add `onRequireAuth` to the props interface:

```ts
interface CommunityGalleryProps {
  // ... existing props
  onRequireAuth?: (action: () => void) => void;
}
```

Wrap `handleLike` body:

```ts
const handleLike = async (e: React.MouseEvent, id: string, currentLikes: number) => {
  e.stopPropagation();
  if (onRequireAuth) {
    onRequireAuth(() => performLike(id, currentLikes));
    return;
  }
  performLike(id, currentLikes);
};

const performLike = async (id: string, currentLikes: number) => {
  // ... existing like logic moved here
};
```

**Step 6: Gate `handleLike` in `PromptMarketplace.tsx`** — same pattern.

**Step 7: Type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: 0 errors, 0 warnings

**Step 8: Commit**

```bash
git add App.tsx components/CommunityGallery.tsx components/PromptMarketplace.tsx
git commit -m "feat(auth): gate publish and social actions behind requireAuth"
```

---

### Task 6: Build `ProfilePage.tsx`

**Files:**

- Create: `components/ProfilePage.tsx`

**Step 1: Create the component**

```tsx
import React, { useState, useEffect } from 'react';
import {
  User,
  Edit2,
  Check,
  X,
  LogOut,
  Trash2,
  BarChart2,
  Heart,
  Layout,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { User as UserType, Project } from '../types.ts';
import { supabase } from '../services/supabaseClient.ts';
import { fetchUserDiagrams, deleteUserDiagram } from '../services/supabaseClient.ts';
import { toast } from 'sonner';

interface ProfilePageProps {
  user: UserType;
  projects: Project[];
  onSignOut: () => void;
  onOpenDiagram: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  projects,
  onSignOut,
  onOpenDiagram,
  onDeleteProject,
}) => {
  const [username, setUsername] = useState(user.username || '');
  const [editingUsername, setEditingUsername] = useState(false);
  const [cloudDiagrams, setCloudDiagrams] = useState<Project[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);

  useEffect(() => {
    fetchUserDiagrams(user.id).then(setCloudDiagrams);
  }, [user.id]);

  const saveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    const { error } = await supabase.auth.updateUser({ data: { username: trimmed } });
    if (error) {
      toast.error('Failed to update username');
    } else {
      toast.success('Username updated');
      setEditingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    // Supabase requires a server-side admin call to delete users.
    // For now, sign out and show a message.
    toast.info('Please contact support to delete your account.');
    onSignOut();
  };

  const initials = (user.username || user.email || 'U').slice(0, 2).toUpperCase();

  // Combine cloud and local, deduplicate by id (cloud wins)
  const allDiagrams = [
    ...cloudDiagrams,
    ...projects.filter((p) => !cloudDiagrams.find((c) => c.id === p.id)),
  ];

  return (
    <div className="min-h-screen bg-background text-text p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
        )}
        <div className="flex-1">
          {editingUsername ? (
            <div className="flex items-center gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveUsername();
                  if (e.key === 'Escape') setEditingUsername(false);
                }}
                className="text-xl font-bold bg-surface border border-border rounded px-2 py-1 text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <button onClick={saveUsername} className="text-emerald-500 hover:text-emerald-400">
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingUsername(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user.username || 'Anonymous'}</h1>
              <button
                onClick={() => setEditingUsername(true)}
                className="text-text-muted hover:text-primary"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="text-sm text-text-muted">{user.email}</div>
          {user.created_at && (
            <div className="text-xs text-text-muted mt-0.5">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text border border-border rounded-lg hover:bg-surface-hover transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Layout, label: 'Diagrams', value: allDiagrams.length },
          { icon: Heart, label: 'Likes received', value: '—' },
          { icon: BarChart2, label: 'Published', value: cloudDiagrams.length },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4 text-center">
            <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Diagrams */}
      <h2 className="text-lg font-bold mb-4">My Diagrams</h2>
      {allDiagrams.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <Layout className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No diagrams yet. Create your first one in the editor!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {allDiagrams.map((diagram) => (
            <div
              key={diagram.id}
              className="bg-surface border border-border rounded-xl p-4 hover:border-primary/50 transition-colors group"
            >
              <h3 className="font-semibold text-sm mb-1 truncate">{diagram.name}</h3>
              <p className="text-xs text-text-muted mb-3">
                {new Date(diagram.updatedAt).toLocaleDateString()}
              </p>
              <pre className="text-xs text-text-muted bg-background rounded p-2 h-16 overflow-hidden mb-3 font-mono">
                {diagram.code.slice(0, 120)}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenDiagram(diagram)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </button>
                <button
                  onClick={() => onDeleteProject(diagram.id)}
                  className="flex items-center justify-center gap-1 text-xs px-2 py-1.5 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-xl p-4">
        <button
          onClick={() => setShowDangerZone(!showDangerZone)}
          className="flex items-center gap-2 text-red-500 text-sm font-medium w-full text-left"
        >
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </button>
        {showDangerZone && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-text-muted">
              To delete your account, type <strong>DELETE</strong> below and confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-red-500/30"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
```

**Step 2: Type-check**

```bash
bun run type-check
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add components/ProfilePage.tsx
git commit -m "feat(auth): add ProfilePage component"
```

---

### Task 7: Wire `ProfilePage` into `App.tsx` and `Header.tsx`

**Files:**

- Modify: `App.tsx`
- Modify: `components/Header.tsx`

**Step 1: Add lazy import in `App.tsx`**

```ts
const ProfilePage = lazy(() => import('./components/ProfilePage.tsx'));
```

**Step 2: Add `#profile` route in App.tsx JSX**

Find the section where other views are conditionally rendered (look for `currentView === 'faq'` or similar). Add:

```tsx
{
  currentView === 'profile' && user && (
    <Suspense fallback={<div className="p-8 text-center text-text-muted">Loading...</div>}>
      <ProfilePage
        user={user}
        projects={projects}
        onSignOut={async () => {
          await signOut();
          setUser(null);
          setCurrentView('landing');
        }}
        onOpenDiagram={(project) => {
          handleSelectProject(project.id);
          setCurrentView('app');
        }}
        onDeleteProject={handleDeleteProject}
      />
    </Suspense>
  );
}
{
  currentView === 'profile' && !user && (
    // Redirect to landing if not logged in
    <>{setCurrentView('landing')}</>
  );
}
```

Add `signOut` to the import from `supabaseClient`:

```ts
import {
  publishDiagram,
  getCurrentUser,
  onAuthStateChange,
  signOut,
} from './services/supabaseClient.ts';
```

**Step 3: Add "Profile" to the user dropdown in `Header.tsx`**

Find the user dropdown menu (around the `showUserMenu && user` block). Add a Profile link above the existing items:

```tsx
<button
  onClick={() => {
    onNavigate('profile');
    setShowUserMenu(false);
  }}
  className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-hover rounded transition-colors"
>
  My Profile
</button>
```

The `Header` component already receives `onNavigate` or equivalent — check the actual prop name (`setCurrentView` passed as `onNavigate`). Add `onNavigate` to the Header props interface if not already there.

**Step 4: Type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: 0 errors, 0 warnings

**Step 5: Run full test suite**

```bash
bun run test:run
```

Expected: all pass

**Step 6: Commit**

```bash
git add App.tsx components/Header.tsx
git commit -m "feat(auth): wire ProfilePage into App routing and Header nav"
```

---

### Task 8: Supabase SQL migration

**Files:**

- Create: `supabase/migrations/20260226_user_diagrams.sql`

**Step 1: Create migration file**

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/20260226_user_diagrams.sql`:

```sql
-- User diagrams table for cloud sync
create table if not exists public.user_diagrams (
  id           text primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  title        text not null default 'Untitled',
  code         text not null default '',
  diagram_type text not null default 'mermaid',
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

-- Index for fast user lookups
create index if not exists user_diagrams_user_id_idx
  on public.user_diagrams (user_id, updated_at desc);

-- Row level security
alter table public.user_diagrams enable row level security;

create policy "Users can CRUD own diagrams"
  on public.user_diagrams for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Step 2: Apply in Supabase dashboard**

Copy the SQL above and run it in the Supabase SQL editor for your project. (Or use `supabase db push` if CLI is set up.)

**Step 3: Commit**

```bash
git add supabase/migrations/20260226_user_diagrams.sql
git commit -m "feat(auth): add user_diagrams Supabase migration"
```

---

### Task 9: Final validation

**Step 1: Run full validate**

```bash
bun run validate
```

Expected: type-check passes, lint passes (0 warnings), all tests pass

**Step 2: Manual smoke test**

Start dev server:

```bash
bun run dev
```

Test checklist:

- [ ] Sign up with email → redirected to app
- [ ] Sign in with GitHub/Google OAuth → user menu shows username
- [ ] Navigate to `#profile` → see profile page
- [ ] Edit username → saves correctly
- [ ] Create a diagram → appears in profile diagrams grid
- [ ] Click publish without being signed in → auth modal appears, after sign-in publish proceeds
- [ ] Like a diagram without being signed in → auth modal appears
- [ ] Sign out → redirected to landing

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(auth): complete auth implementation — cloud sync, gating, profile"
```

**Step 4: Push**

```bash
git push origin main
```
