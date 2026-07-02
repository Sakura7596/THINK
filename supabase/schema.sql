create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  kind text not null default 'thought',
  diary_date date,

  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  is_deleted boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notes
add column if not exists kind text not null default 'thought';

alter table public.notes
add column if not exists diary_date date;

update public.notes
set kind = 'thought'
where kind is null;

alter table public.notes
drop constraint if exists notes_kind_check;

alter table public.notes
add constraint notes_kind_check
check (kind in ('thought', 'diary'));

alter table public.notes
drop constraint if exists notes_diary_date_check;

alter table public.notes
add constraint notes_diary_date_check
check (kind <> 'diary' or diary_date is not null);

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

create index if not exists notes_kind_updated_idx
on public.notes (kind, updated_at desc);

create index if not exists notes_diary_date_idx
on public.notes (diary_date desc)
where kind = 'diary';

create unique index if not exists notes_diary_date_unique
on public.notes (diary_date)
where kind = 'diary' and is_deleted = false;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.notes to service_role;
