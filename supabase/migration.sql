-- M&M Design Group — Supabase migration
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
insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'horizon-house',
  'Horizon House',
  'Contemporary Houses',
  'Cape Town',
  '2023',
  '480 m²',
  'Completed',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80',
  '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80","https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=1200&q=80","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"]'::jsonb,
  'Horizon House dissolves the boundary between the built environment and the dramatic Cape landscape. Perched above the Atlantic seaboard, the residence cascades down a rocky promontory, its horizontal planes echoing the geological strata beneath. Each room frames a curated panorama — the horizon itself becomes architecture.',
  'The site presented extreme wind exposure and a 14-metre vertical drop. Building on protected coastal land required meticulous environmental assessment and a structure that appeared to float without touching. Conventional foundations were impossible; instead, a system of micro-piles anchors the building into the bedrock at precise intervals.',
  'Horizon House has become a landmark of contemporary South African residential architecture, featured in Architectural Digest and shortlisted for the SAIA Award of Merit. Its passive cooling system — achieved through strategic overhangs and cross-ventilation — eliminates the need for mechanical air conditioning.',
  1
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
  updated_at = now();

insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'the-glass-museum',
  'The Glass Museum',
  'Museums',
  'Johannesburg',
  '2022',
  '3,200 m²',
  'Completed',
  'https://images.unsplash.com/photo-1594818379496-da1e345b0ded?w=900&q=80',
  '["https://images.unsplash.com/photo-1467306983809-c2c4ff1b98e1?w=1200&q=80","https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80"]'::jsonb,
  'The Glass Museum redefines the relationship between art, architecture, and light. Its double-skin glass façade acts as a living membrane — translucent by day, luminous by night. Interior galleries are arranged around a central atrium where natural light is choreographed through the seasons, transforming the building itself into an exhibit.',
  'Creating climate-controlled gallery environments within an all-glass envelope required engineering innovation. A custom electrochromic glazing system adjusts opacity in response to UV intensity, protecting artworks while maintaining the visual language of transparency. Acoustic separation between galleries demanded hidden mass-timber construction within the glass skin.',
  'The museum attracted over 200,000 visitors in its first year, becoming one of Johannesburg''s most significant cultural landmarks. Its sustainable energy profile — 40% below code requirements — was achieved through integrated photovoltaic panels concealed within the roof structure.',
  2
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
  updated_at = now();

insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'villa-azzurra',
  'Villa Azzurra',
  'Villas',
  'Sandton',
  '2023',
  '720 m²',
  'Completed',
  'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=900&q=80',
  '["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80","https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80","https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80"]'::jsonb,
  'Villa Azzurra is a meditation on materiality and restraint. Travertine walls quarried in Turkey meet Brazilian hardwood ceilings in a dialogue of warm stone and grain. The 35-metre infinity pool appears to dissolve into the Johannesburg skyline — a horizon of water meeting the urban horizon beyond.',
  'The client''s brief demanded maximum privacy from neighbouring properties while maintaining a sense of openness. Our solution: a series of internal courtyards that bring sky and vegetation into every room without exposing the interior to external sight lines. Fourteen mature trees were relocated to create an instant landscape.',
  'Villa Azzurra represents our most complete expression of indoor-outdoor living. The home maintains a constant 21°C through a geothermal system drawing from a borehole sunk 120 metres into the Highveld bedrock. It was awarded the FNB Architects of the Year: Residential Award 2023.',
  3
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
  updated_at = now();

insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'meridian-research-academy',
  'Meridian Research Academy',
  'Research Academies',
  'Pretoria',
  '2021',
  '8,400 m²',
  'Completed',
  'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80","https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80","https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80"]'::jsonb,
  'The Meridian Research Academy was conceived as a machine for thinking. Its plan is organised around a central spine — a linear street of intellectual exchange — from which laboratories, seminar rooms, and quiet reading alcoves radiate like synapses. The building actively encourages the productive collision of disciplines.',
  'Designing a 400-person research campus on a budget of R180 million required ruthless prioritisation. We chose to spend where it matters most: the shared commons, the primary façade, and the acoustic quality of every room. Secondary spaces are built with an honest palette of fair-faced concrete and painted steel.',
  'Meridian is now home to seven research departments and hosts three international scientific conferences annually. The building''s flexible partition system allows any interior space to be reconfigured within 48 hours, a feature that has proven invaluable as research programmes evolve.',
  4
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
  updated_at = now();

insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'dune-villa',
  'Dune Villa',
  'Villas',
  'Camps Bay',
  '2022',
  '550 m²',
  'Completed',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=900&q=80',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80","https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1200&q=80","https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=1200&q=80"]'::jsonb,
  'Dune Villa clings to the cliff face above Camps Bay with the tenacity of a geological formation. Its form is derived from the rock itself — angular volumes that step with the topography, creating terraced outdoor living platforms at every level. The Atlantic is visible from every room.',
  'The extreme angle of the site — a 38-degree slope — made conventional construction impossible. A series of reinforced concrete platforms were cast directly into the cliff face, with each level connected by a sculptural stair that doubles as a structural element. All materials were delivered by cable system from the road above.',
  'Dune Villa has been published in twelve international design publications. Its cantilevered master suite — projecting 6 metres over the cliff edge — has become its most iconic feature, photographed at sunrise to capture the precise moment the Atlantic catches the first light.',
  5
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
  updated_at = now();

insert into public.projects (
  slug, name, category, location, year, area, status, image, gallery,
  description, challenge, outcome, sort_order
) values (
  'memory-museum',
  'Memory Museum',
  'Museums',
  'Durban',
  '2020',
  '2,800 m²',
  'Completed',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=900&q=80',
  '["https://images.unsplash.com/photo-1531512073830-606951c7f8b1?w=1200&q=80","https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=1200&q=80","https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1200&q=80"]'::jsonb,
  'Memory Museum is a place of silence and reckoning. Designed to house a permanent collection of South African historical artefacts, the building is itself a memorial — its circulation path tracing a slow, deliberate descent from the present into the past. Visitors emerge into a subterranean contemplation chamber illuminated by a single oculus overhead.',
  'The museum sits on a site with significant archaeological sensitivity. Construction required continuous archaeological monitoring and the relocation of three cultural heritage items found during excavation. The basement contemplation chamber was redesigned three times to accommodate findings that changed our understanding of the site''s history.',
  'Memory Museum opened to critical acclaim and is now one of Durban''s most visited cultural sites. Its contemplation chamber — reached after a 40-metre underground walk — has been described by critics as one of the most powerful spatial experiences in contemporary South African architecture.',
  6
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
  updated_at = now();
-- ---------------------------------------------------------------------------
-- Promote your account to admin (replace with your email after signing up)
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'admin', updated_at = now()
-- where email = 'you@example.com';
