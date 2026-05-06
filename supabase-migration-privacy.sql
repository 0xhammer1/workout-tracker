-- ============================================================
-- Privacy migration. Run in Supabase SQL Editor.
-- ============================================================
-- Adds a default_privacy column to user_profiles. Friends only
-- see what each user has agreed to share.
--
--   none       -- workouts don't appear in friends' feeds
--   minimal    -- "I worked out today" (no category, no details)
--   type_only  -- date + category (push/pull/legs)
--   full       -- date + category + every set/rep/weight
--
-- Default is 'full' to match existing behavior. Users can lower
-- it from the Profile tab.

-- 1. user_profiles.default_privacy --------------------------
alter table user_profiles
  add column if not exists default_privacy text not null default 'full';

-- Drop and re-add the check so re-runs pick up new values
alter table user_profiles drop constraint if exists user_profiles_default_privacy_check;
alter table user_profiles
  add constraint user_profiles_default_privacy_check
  check (default_privacy in ('none', 'minimal', 'type_only', 'full'));

-- 2. workouts: friends see only what privacy allows ----------
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
    and exists (
      select 1 from user_profiles up
      where up.user_id = workouts.user_id
        and up.default_privacy <> 'none'
    )
  );

-- 3. sets: friends only see sets when privacy = 'full' -------
drop policy if exists "users read friends sets" on sets;
create policy "users read friends sets" on sets
  for select using (
    exists (
      select 1
      from workouts w
      join friend_requests fr on (
        (fr.from_user_id = auth.uid() and fr.to_user_id = w.user_id)
        or (fr.to_user_id = auth.uid() and fr.from_user_id = w.user_id)
      )
      join user_profiles up on up.user_id = w.user_id
      where w.id = sets.workout_id
        and fr.status = 'accepted'
        and up.default_privacy = 'full'
    )
  );
