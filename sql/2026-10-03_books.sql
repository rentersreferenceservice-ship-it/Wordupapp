-- Picture-book creator/reader v1.
-- Run once in the Supabase SQL editor. This repo has no migration
-- tooling, so this file is kept only as a record of what was run and when.

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  practitioner_id text not null,
  title text not null,
  subtitle text,
  author text,
  cover_image_url text,
  pages jsonb not null default '[]',  -- [{ imageUrl, caption }, ...] in reading order
  visibility text not null default 'private' check (visibility in ('private', 'link')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_practitioner_idx on books (practitioner_id);
