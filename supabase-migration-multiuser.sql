-- ============================================================
-- Multi-user migration. Run this in Supabase SQL Editor.
-- ============================================================
-- Adds user_id to user-owned tables, enables Row Level Security,
-- replaces the single-row `profile` table with `user_profiles`.

-- 1. NEW user_profiles TABLE (keyed by auth.users.id) ----------
create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

drop policy if exists "users read own profile" on user_profiles;
drop policy if exists "users insert own profile" on user_profiles;
drop policy if exists "users update own profile" on user_profiles;

create policy "users read own profile" on user_profiles
  for select using (auth.uid() = user_id);
create policy "users insert own profile" on user_profiles
  for insert with check (auth.uid() = user_id);
create policy "users update own profile" on user_profiles
  for update using (auth.uid() = user_id);

-- 2. WORKOUTS ----------------------------------------------
alter table workouts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table workouts alter column user_id set default auth.uid();

alter table workouts enable row level security;

drop policy if exists "users read own workouts" on workouts;
drop policy if exists "users insert own workouts" on workouts;
drop policy if exists "users update own workouts" on workouts;
drop policy if exists "users delete own workouts" on workouts;

create policy "users read own workouts" on workouts
  for select using (auth.uid() = user_id);
create policy "users insert own workouts" on workouts
  for insert with check (auth.uid() = user_id);
create policy "users update own workouts" on workouts
  for update using (auth.uid() = user_id);
create policy "users delete own workouts" on workouts
  for delete using (auth.uid() = user_id);

-- 3. SETS (inherit security through workouts) -----------------
alter table sets enable row level security;

drop policy if exists "users read own sets" on sets;
drop policy if exists "users insert own sets" on sets;
drop policy if exists "users update own sets" on sets;
drop policy if exists "users delete own sets" on sets;

create policy "users read own sets" on sets
  for select using (
    exists (select 1 from workouts w where w.id = sets.workout_id and w.user_id = auth.uid())
  );
create policy "users insert own sets" on sets
  for insert with check (
    exists (select 1 from workouts w where w.id = sets.workout_id and w.user_id = auth.uid())
  );
create policy "users update own sets" on sets
  for update using (
    exists (select 1 from workouts w where w.id = sets.workout_id and w.user_id = auth.uid())
  );
create policy "users delete own sets" on sets
  for delete using (
    exists (select 1 from workouts w where w.id = sets.workout_id and w.user_id = auth.uid())
  );

-- 4. WEIGHT_LOGS ----------------------------------------------
alter table weight_logs add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table weight_logs alter column user_id set default auth.uid();

alter table weight_logs enable row level security;

drop policy if exists "users read own weights" on weight_logs;
drop policy if exists "users insert own weights" on weight_logs;
drop policy if exists "users update own weights" on weight_logs;
drop policy if exists "users delete own weights" on weight_logs;

create policy "users read own weights" on weight_logs
  for select using (auth.uid() = user_id);
create policy "users insert own weights" on weight_logs
  for insert with check (auth.uid() = user_id);
create policy "users update own weights" on weight_logs
  for update using (auth.uid() = user_id);
create policy "users delete own weights" on weight_logs
  for delete using (auth.uid() = user_id);

-- 5. EXERCISES (shared, all authed users can read/contribute) -
alter table exercises enable row level security;

drop policy if exists "authed read exercises" on exercises;
drop policy if exists "authed insert exercises" on exercises;
drop policy if exists "authed update exercises" on exercises;

create policy "authed read exercises" on exercises
  for select using (auth.role() = 'authenticated');
create policy "authed insert exercises" on exercises
  for insert with check (auth.role() = 'authenticated');
create policy "authed update exercises" on exercises
  for update using (auth.role() = 'authenticated');

-- 6. (Optional) drop the old single-row profile table ---------
-- drop table if exists profile;
