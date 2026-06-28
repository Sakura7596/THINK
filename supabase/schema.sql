create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',

  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_notes_updated_at on public.notes;

create trigger set_notes_updated_at
before update on public.notes
for each row
execute function public.set_updated_at();

create index if not exists notes_updated_idx
on public.notes (updated_at desc);

create index if not exists notes_pinned_idx
on public.notes (is_pinned);

create index if not exists notes_archived_idx
on public.notes (is_archived);

create index if not exists notes_tags_idx
on public.notes using gin (tags);
