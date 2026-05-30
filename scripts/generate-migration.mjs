import { writeFileSync } from 'fs';
import { projects } from '../src/data/projects-fallback.js';

const header = `-- M&M Design Group — Supabase migration
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT upserts.
-- Paste into Supabase SQL Editor and run once.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  location text not null,
  year text not null,
  area text,
  status text,
  image text not null,
  gallery jsonb not null default '[]'::jsonb,
  description text not null,
  challenge text not null,
  outcome text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  project_type text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Projects are publicly readable" on public.projects;
create policy "Projects are publicly readable"
  on public.projects for select
  using (true);

drop policy if exists "Anyone can submit contact inquiries" on public.contact_inquiries;
create policy "Anyone can submit contact inquiries"
  on public.contact_inquiries for insert
  with check (true);

drop policy if exists "Admins can read contact inquiries" on public.contact_inquiries;
create policy "Admins can read contact inquiries"
  on public.contact_inquiries for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Seed projects (preserves existing rows; updates content on slug match)
-- ---------------------------------------------------------------------------
`;

const esc = (value) => value.replace(/'/g, "''");

const inserts = projects.map((p, index) => {
  const gallery = esc(JSON.stringify(p.gallery));
  return `insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  '${esc(p.slug)}',
  '${esc(p.name)}',
  '${esc(p.category)}',
  '${esc(p.location)}',
  '${esc(p.year)}',
  '${esc(p.area)}',
  '${esc(p.status)}',
  '${esc(p.image)}',
  '${gallery}'::jsonb,
  '${esc(p.description)}',
  '${esc(p.challenge)}',
  '${esc(p.outcome)}',
  ${index + 1}
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  location = excluded.location,
  year = excluded.year,
  area = excluded.area,
  status = excluded.status,
  image = excluded.image,
  gallery = excluded.gallery,
  description = excluded.description,
  challenge = excluded.challenge,
  outcome = excluded.outcome,
  sort_order = excluded.sort_order,
  updated_at = now();`;
}).join('\n\n');

const footer = `
-- ---------------------------------------------------------------------------
-- Promote your account to admin (replace with your email after signing up)
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'admin', updated_at = now()
-- where email = 'you@example.com';
`;

writeFileSync(new URL('../supabase/migration.sql', import.meta.url), header + inserts + footer);
console.log('Wrote supabase/migration.sql with', projects.length, 'projects');
