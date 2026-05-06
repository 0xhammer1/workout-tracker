-- ============================================================
-- Track when a user queues a friend's workout.
-- Enables "influence" badges (Trendsetter, Gym-fluencer, etc.).
-- Run in Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS workout_copies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
  source_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  copier_user_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  copied_at       timestamptz DEFAULT now(),
  -- one entry per (workout, copier) pair — re-queuing the same workout doesn't inflate the count
  UNIQUE(source_workout_id, copier_user_id)
);

ALTER TABLE workout_copies ENABLE ROW LEVEL SECURITY;

-- Source user can read copies of their own workouts (for badge counts)
CREATE POLICY "source user reads copies of own workouts" ON workout_copies
  FOR SELECT USING (auth.uid() = source_user_id);

-- Any authenticated user can insert a copy (copying a friend's workout)
CREATE POLICY "authenticated users insert copies" ON workout_copies
  FOR INSERT WITH CHECK (auth.uid() = copier_user_id);
