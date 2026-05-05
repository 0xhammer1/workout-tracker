-- Run this in your Supabase SQL editor

create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

create table sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references workouts(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  set_number int not null,
  reps int,
  weight numeric,
  created_at timestamptz default now()
);

-- Seed common exercises
insert into exercises (name) values
  ('Bench Press'),
  ('Squat'),
  ('Deadlift'),
  ('Overhead Press'),
  ('Barbell Row'),
  ('Pull-Up'),
  ('Chin-Up'),
  ('Dumbbell Curl'),
  ('Tricep Pushdown'),
  ('Lat Pulldown'),
  ('Leg Press'),
  ('Romanian Deadlift'),
  ('Incline Bench Press'),
  ('Cable Row'),
  ('Face Pull'),
  ('Lateral Raise'),
  ('Front Squat'),
  ('Hip Thrust'),
  ('Leg Curl'),
  ('Leg Extension'),
  ('Calf Raise'),
  ('Dumbbell Row'),
  ('Chest Fly'),
  ('Dips'),
  ('Plank');
