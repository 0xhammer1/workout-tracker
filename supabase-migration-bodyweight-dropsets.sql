-- Bodyweight exercise flag and drop set support

alter table exercises
  add column if not exists is_bodyweight boolean default false;

alter table sets
  add column if not exists is_drop_set boolean default false;
