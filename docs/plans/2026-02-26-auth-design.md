# Auth Design — 2026-02-26

## Scope

Three interconnected features that complete the authentication experience:

1. **Cloud sync** — user diagrams persist in Supabase, synced with localStorage
2. **Auth-gating** — social actions (publish, like, comment) require login
3. **Profile page** — `#profile` route with user info, diagrams, account management

## Approach

Incremental wiring (Option A). The auth plumbing is already ~80% built:

- `AuthModal.tsx` — sign in / sign up modal with GitHub, Google, and email/password
- `supabaseClient.ts` — `signUp`, `signIn`, `signOut`, `signInWithOAuth`, `onAuthStateChange`
- `App.tsx` — `user` state, `isAuthModalOpen`, auth state listener
- `Header.tsx` — user menu dropdown

No architectural refactor. Wire up what exists, add the missing pieces.

---

## Section 1: Cloud Sync

### Data Model

New Supabase table `user_diagrams`:

```sql
create table user_diagrams (
  id          text primary key,        -- same as localStorage project id
  user_id     uuid references auth.users not null,
  title       text not null,
  code        text not null default '',
  diagram_type text not null default 'mermaid',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table user_diagrams enable row level security;
create policy "Users can CRUD own diagrams"
  on user_diagrams for all
  using (auth.uid() = user_id);
```

### Sync Hook: `useDiagramSync`

```
hooks/useDiagramSync.ts
```

- On sign-in: upload all localStorage projects to `user_diagrams` (upsert, local wins on conflict), then fetch cloud diagrams and merge into state
- On save: write to localStorage + upsert to Supabase (fire-and-forget, no blocking)
- On sign-out: keep local state as-is
- On load (already signed in): fetch from Supabase, merge with localStorage

### Merge Strategy

- Conflict resolution: compare `updated_at`; newer wins
- Deduplication: by `id` (same ID = same diagram)
- Anonymous → signed-in migration: all local diagrams are uploaded on first sign-in

---

## Section 2: Auth-gating

### Gated Actions

| Action             | Current behavior | Gated behavior |
| ------------------ | ---------------- | -------------- |
| Publish to gallery | Always allowed   | Requires auth  |
| Like a diagram     | Always allowed   | Requires auth  |
| Add a comment      | Always allowed   | Requires auth  |

### Implementation

A `requireAuth` utility in App.tsx:

```ts
const requireAuth = (action: () => void) => {
  if (user) {
    action();
  } else {
    setPendingAction(() => action);
    setAuthModalMode('signin');
    setIsAuthModalOpen(true);
  }
};
```

`pendingAction` is a `useRef<(() => void) | null>`. On `onAuthSuccess`, if `pendingAction.current` exists, call it and clear it.

No UI changes to buttons — they stay visible to anonymous users and prompt login on click.

---

## Section 3: Profile Page

### Route

`#profile` added to `VALID_VIEWS` in `useAppRouter.ts` and `AppView` in `types.ts`.

### Component: `ProfilePage.tsx`

**Header section:**

- Avatar: `avatar_url` from OAuth, or initials fallback (colored circle)
- Username: inline editable — click to edit, Enter/blur to save via `supabase.auth.updateUser`
- Email (read-only), join date

**Stats bar:**

- Total diagrams saved
- Total likes received (sum across `user_diagrams` joined to `community_diagrams`)
- Total published to gallery

**Diagrams grid:**

- Fetched from `user_diagrams` table
- Same card design as community gallery
- Card actions: "Open in editor" (navigate to `#app`, load diagram), "Delete" (with confirmation)

**Account section:**

- Change password (email users only — hidden for OAuth users)
- Sign out button
- Danger zone: delete account (requires typing "DELETE" to confirm)

### Navigation

Header gets a "Profile" link in the user dropdown menu (already has username + email display).

---

## Files Changed

| File                         | Change                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| `types.ts`                   | Add `'profile'` to `AppView`, add `user_metadata` to `User`                         |
| `hooks/useAppRouter.ts`      | Add `'profile'` to `VALID_VIEWS`                                                    |
| `hooks/useDiagramSync.ts`    | **New** — cloud sync logic                                                          |
| `services/supabaseClient.ts` | Add `user_diagrams` CRUD functions                                                  |
| `components/ProfilePage.tsx` | **New** — profile route component                                                   |
| `App.tsx`                    | Wire `useDiagramSync`, add `requireAuth`, add `#profile` route, add `pendingAction` |
| `components/Header.tsx`      | Add "Profile" link to user dropdown                                                 |

## Out of Scope

- Real-time collaboration (Phase 5)
- GitHub integration (separate roadmap item)
- Email verification flow changes
- MFA / SSO
