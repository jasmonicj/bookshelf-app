-- Bookshelf App Schema
-- Run this in the Supabase SQL Editor

-- Locations table
create table public.locations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

-- Books table
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  author text not null default '',
  isbn text,
  cover_url text,
  status text not null default 'want' check (status in ('want', 'reading', 'read')),
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now() not null
);

-- Reference notes table
create table public.reference_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  content text not null,
  page_ref text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Row Level Security
alter table public.locations enable row level security;
alter table public.books enable row level security;
alter table public.projects enable row level security;
alter table public.reference_notes enable row level security;

-- Policies: users can only access their own data
create policy "Users can manage own locations" on public.locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own reference_notes" on public.reference_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at before update on public.books
  for each row execute function public.handle_updated_at();

create trigger reference_notes_updated_at before update on public.reference_notes
  for each row execute function public.handle_updated_at();
