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
