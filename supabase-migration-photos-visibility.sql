-- ============================================================
-- Photos visible regardless of privacy level (other than 'none').
-- Run after supabase-migration-photos.sql.
-- ============================================================
-- Originally photos were only readable by friends when the owner
-- was on default_privacy='full'. Now we decouple: as long as the
-- workout itself is visible (privacy <> 'none'), the photo is
-- visible too. Sets/reps/weights still respect the privacy gate.

drop policy if exists "users read friends photos" on workout_photos;
create policy "users read friends photos" on workout_photos
  for select using (
    exists (
      select 1
      from friend_requests fr
      join user_profiles up on up.user_id = workout_photos.user_id
      where fr.status = 'accepted'
        and up.default_privacy <> 'none'
        and (
          (fr.from_user_id = auth.uid() and fr.to_user_id = workout_photos.user_id)
          or (fr.to_user_id = auth.uid() and fr.from_user_id = workout_photos.user_id)
        )
    )
  );
