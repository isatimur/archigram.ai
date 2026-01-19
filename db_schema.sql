
-- Run this in your Supabase SQL Editor to create the table

create table community_diagrams (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  author text,
  description text,
  code text not null,
  tags text[] default '{}',
  likes bigint default 0,
  views bigint default 0
);

-- Enable Row Level Security (RLS)
alter table community_diagrams enable row level security;

-- Create Policy: Allow anyone to read (Select)
create policy "Public diagrams are viewable by everyone"
  on community_diagrams for select
  using ( true );

-- Create Policy: Allow anyone to insert (Publish)
-- In a real app, you might want to restrict this to authenticated users
create policy "Anyone can upload a diagram"
  on community_diagrams for insert
  with check ( true );
