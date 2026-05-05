-- Run this in your Supabase SQL Editor to add bodyweight tracking

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  weight numeric not null,
  created_at timestamptz default now()
);

alter table weight_logs disable row level security;
