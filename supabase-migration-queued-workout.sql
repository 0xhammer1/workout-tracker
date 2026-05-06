-- ============================================================
-- Queued workout. Run in Supabase SQL Editor.
-- ============================================================
-- Stores a single "next workout" pointer on user_profiles. When
-- you tap "Use this workout" on a friend's feed card, we record
-- the source here instead of immediately creating a workout row.
-- The home screen surfaces it as the suggested workout, and the
-- actual row is created when the user starts it.

alter table user_profiles
  add column if not exists queued_source_workout_id uuid
    references workouts(id) on delete set null,
  add column if not exists queued_source_user_id uuid
    references auth.users(id) on delete set null;
