-- Run this in your Supabase SQL Editor to add workout categories

alter table workouts
  add column if not exists category text;
