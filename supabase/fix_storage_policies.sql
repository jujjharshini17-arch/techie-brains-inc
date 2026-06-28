-- Complete fix: creates missing types, tables, functions + storage policies
-- Run this in Supabase SQL Editor

-- 0. Create enum type if missing
do $$
begin
  create type app_role as enum ('Admin', 'User');
exception
  when duplicate_object then null;
end;
$$;

-- 1. Create profiles table if missing
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  phone text,
  role app_role not null default 'User',
  created_at timestamptz not null default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Profiles RLS policies
drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users insert own profile" on public.profiles;
create policy "Users insert own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- 4. Create the helper functions
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where role = 'Admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin');
$$;

-- 5. Create the auth trigger function
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role app_role;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'User');
  if requested_role = 'Admin' and not public.admin_exists() then
    final_role := 'Admin';
  else
    final_role := 'User';
  end if;

  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    final_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- 6. Storage policies
drop policy if exists "Users upload own protected resumes" on storage.objects;
drop policy if exists "Users read own protected resumes" on storage.objects;
drop policy if exists "Admins manage protected resumes" on storage.objects;

create policy "Users upload own protected resumes" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own protected resumes" on storage.objects
  for select using (
    bucket_id = 'resumes' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

create policy "Admins manage protected resumes" on storage.objects
  for all using (
    bucket_id = 'resumes' and public.is_admin()
  ) with check (
    bucket_id = 'resumes' and public.is_admin()
  );
