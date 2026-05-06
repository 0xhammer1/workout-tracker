-- ============================================================
-- Onboarding fields for user_profiles.
-- Run in Supabase SQL Editor.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birthdate date,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- Mark every existing user as already onboarded so the new flow
-- only shows for accounts created after this migration runs.
UPDATE user_profiles SET onboarding_complete = true WHERE onboarding_complete = false;
