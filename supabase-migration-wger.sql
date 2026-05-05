-- Run this in your Supabase SQL Editor before running the wger import script.

alter table exercises
  add column if not exists wger_id int unique,
  add column if not exists equipment text[],
  add column if not exists instructions text,
  add column if not exists image_url text,
  add column if not exists secondary_muscles text[];

create index if not exists idx_exercises_muscle_group on exercises(muscle_group);
