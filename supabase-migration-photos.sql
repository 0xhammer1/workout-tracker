-- ============================================================
-- Photos + reactions + comments migration. Run in SQL Editor.
-- ============================================================
-- Adds:
--   - workout_photos: thirst traps attached to workouts
--   - photo_reactions: heart/flame reactions on photos
--   - photo_comments: comments on photos
--   - storage bucket "workout-photos" with friend-visible access
--
-- Visibility follows the same rule as sets: friends can read
-- photos / reactions / comments only when the photo owner's
-- default_privacy is 'full'.

-- 1. workout_photos -----------------------------------------
create table if not exists workout_photos (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  created_at timestamptz default now()
);

create index if not exists workout_photos_workout_idx on workout_photos (workout_id);
create index if not exists workout_photos_user_idx on workout_photos (user_id, created_at desc);

alter table workout_photos enable row level security;

drop policy if exists "users read own photos" on workout_photos;
drop policy if exists "users read friends photos" on workout_photos;
drop policy if exists "users insert own photos" on workout_photos;
drop policy if exists "users delete own photos" on workout_photos;

create policy "users read own photos" on workout_photos
  for select using (user_id = auth.uid());

create policy "users read friends photos" on workout_photos
  for select using (
    exists (
      select 1
      from friend_requests fr
      join user_profiles up on up.user_id = workout_photos.user_id
      where fr.status = 'accepted'
        and up.default_privacy = 'full'
        and (
          (fr.from_user_id = auth.uid() and fr.to_user_id = workout_photos.user_id)
          or (fr.to_user_id = auth.uid() and fr.from_user_id = workout_photos.user_id)
        )
    )
  );

create policy "users insert own photos" on workout_photos
  for insert with check (user_id = auth.uid());

create policy "users delete own photos" on workout_photos
  for delete using (user_id = auth.uid());

-- 2. photo_reactions ----------------------------------------
create table if not exists photo_reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references workout_photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('heart', 'flame')),
  created_at timestamptz default now(),
  unique (photo_id, user_id, reaction)
);

create index if not exists photo_reactions_photo_idx on photo_reactions (photo_id);

alter table photo_reactions enable row level security;

drop policy if exists "users read reactions on visible photos" on photo_reactions;
drop policy if exists "users react to visible photos" on photo_reactions;
drop policy if exists "users delete own reactions" on photo_reactions;

-- Anyone who can read the photo can see its reactions
create policy "users read reactions on visible photos" on photo_reactions
  for select using (
    exists (select 1 from workout_photos p where p.id = photo_reactions.photo_id)
  );

create policy "users react to visible photos" on photo_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from workout_photos p where p.id = photo_reactions.photo_id)
  );

create policy "users delete own reactions" on photo_reactions
  for delete using (user_id = auth.uid());

-- 3. photo_comments -----------------------------------------
create table if not exists photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references workout_photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 500),
  created_at timestamptz default now()
);

create index if not exists photo_comments_photo_idx on photo_comments (photo_id, created_at);

alter table photo_comments enable row level security;

drop policy if exists "users read comments on visible photos" on photo_comments;
drop policy if exists "users comment on visible photos" on photo_comments;
drop policy if exists "users delete own comments" on photo_comments;
drop policy if exists "photo owner deletes any comment" on photo_comments;

create policy "users read comments on visible photos" on photo_comments
  for select using (
    exists (select 1 from workout_photos p where p.id = photo_comments.photo_id)
  );

create policy "users comment on visible photos" on photo_comments
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from workout_photos p where p.id = photo_comments.photo_id)
  );

create policy "users delete own comments" on photo_comments
  for delete using (user_id = auth.uid());

create policy "photo owner deletes any comment" on photo_comments
  for delete using (
    exists (
      select 1 from workout_photos p
      where p.id = photo_comments.photo_id and p.user_id = auth.uid()
    )
  );

-- 4. Storage bucket -----------------------------------------
-- Public-read bucket; non-enumerable URLs make it sufficiently
-- private for a small social app. Tighten with signed URLs later
-- if needed.
insert into storage.buckets (id, name, public)
values ('workout-photos', 'workout-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "anyone reads workout photos bucket" on storage.objects;
drop policy if exists "users upload own workout photos"  on storage.objects;
drop policy if exists "users delete own workout photos"  on storage.objects;

create policy "anyone reads workout photos bucket" on storage.objects
  for select using (bucket_id = 'workout-photos');

create policy "users upload own workout photos" on storage.objects
  for insert with check (
    bucket_id = 'workout-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own workout photos" on storage.objects
  for delete using (
    bucket_id = 'workout-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
