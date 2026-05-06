-- ============================================================
-- Friends migration. Run this in Supabase SQL Editor.
-- ============================================================
-- Adds a friend_requests table (which doubles as the friendship
-- store once status='accepted'), RLS, an email-search RPC, and
-- new policies so friends can read each others' workouts and
-- profiles.

-- 1. friend_requests TABLE -----------------------------------
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id   uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz default now(),
  responded_at timestamptz,
  check (from_user_id <> to_user_id),
  unique (from_user_id, to_user_id)
);

-- Speed up the friend-list / feed queries
create index if not exists friend_requests_from_idx on friend_requests (from_user_id, status);
create index if not exists friend_requests_to_idx   on friend_requests (to_user_id,   status);

alter table friend_requests enable row level security;

drop policy if exists "users read own friend rows"     on friend_requests;
drop policy if exists "users send friend requests"     on friend_requests;
drop policy if exists "users respond to friend requests" on friend_requests;
drop policy if exists "users delete own friend rows"   on friend_requests;

create policy "users read own friend rows" on friend_requests
  for select using (from_user_id = auth.uid() or to_user_id = auth.uid());

create policy "users send friend requests" on friend_requests
  for insert with check (from_user_id = auth.uid());

create policy "users respond to friend requests" on friend_requests
  for update using (to_user_id = auth.uid());

create policy "users delete own friend rows" on friend_requests
  for delete using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- 2. Friends can read each others' workouts -----------------
drop policy if exists "users read friends workouts" on workouts;
create policy "users read friends workouts" on workouts
  for select using (
    exists (
      select 1 from friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.from_user_id = auth.uid() and fr.to_user_id = workouts.user_id)
          or
          (fr.to_user_id = auth.uid() and fr.from_user_id = workouts.user_id)
        )
    )
  );

-- 3. Friends can read each others' user_profiles -----------
drop policy if exists "users read friends profiles" on user_profiles;
create policy "users read friends profiles" on user_profiles
  for select using (
    exists (
      select 1 from friend_requests fr
      where fr.status = 'accepted'
        and (
          (fr.from_user_id = auth.uid() and fr.to_user_id = user_profiles.user_id)
          or
          (fr.to_user_id = auth.uid() and fr.from_user_id = user_profiles.user_id)
        )
    )
  );

-- Pending requests need to show display_name + avatar of the
-- other party too, so allow reading the profile of someone
-- who has any friend_request row with you (pending OR accepted).
drop policy if exists "users read pending requesters profiles" on user_profiles;
create policy "users read pending requesters profiles" on user_profiles
  for select using (
    exists (
      select 1 from friend_requests fr
      where (fr.from_user_id = auth.uid() and fr.to_user_id = user_profiles.user_id)
         or (fr.to_user_id = auth.uid() and fr.from_user_id = user_profiles.user_id)
    )
  );

-- 4. RPC: find user by email --------------------------------
-- security definer so we can read auth.users; returns nothing
-- when the email is the caller's own (so the UI can't add self).
create or replace function find_user_by_email(search_email text)
returns table (id uuid, email text, display_name text, avatar_url text)
language sql
security definer
set search_path = public, auth
as $$
  select au.id, au.email::text, up.display_name, up.avatar_url
  from auth.users au
  left join public.user_profiles up on up.user_id = au.id
  where lower(au.email) = lower(trim(search_email))
    and au.id <> auth.uid()
  limit 1;
$$;

revoke all on function find_user_by_email(text) from public;
grant execute on function find_user_by_email(text) to authenticated;

-- 5. Auto-create user_profiles on signup --------------------
-- Without this, a new user has no profile row until they visit
-- the Profile tab, which means their display_name/avatar can't
-- be shown to friends until then.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      'You'
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users that don't have a profile row yet
insert into public.user_profiles (user_id, display_name)
select
  au.id,
  coalesce(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'You'
  )
from auth.users au
left join public.user_profiles up on up.user_id = au.id
where up.user_id is null;
