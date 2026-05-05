-- Run this in your Supabase SQL Editor to enable a personal profile row

create table if not exists profile (
  id int primary key default 1,
  name text default 'Mitchell',
  avatar_url text,
  created_at timestamptz default now(),
  constraint single_row check (id = 1)
);

insert into profile (id) values (1) on conflict do nothing;

alter table profile disable row level security;
