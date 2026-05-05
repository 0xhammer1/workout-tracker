-- Run this in your Supabase SQL Editor to allow custom muscle groups per exercise

alter table exercises
  add column if not exists muscle_group text;
