-- Looks up the owner of a shared workout and creates an accepted friendship
-- between them and the new user. Returns the owner's user_id so the caller
-- can redirect to their profile, or null if nothing was done (owner not found
-- or same user).
--
-- SECURITY DEFINER lets the function read workouts and write friend_requests
-- regardless of the caller's RLS policies — safe because we only ever write
-- a row where from_user_id = p_new_user_id (the authenticated caller).
CREATE OR REPLACE FUNCTION auto_friend_from_workout(p_workout_id uuid, p_new_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id FROM workouts WHERE id = p_workout_id;

  -- No-op if the workout doesn't exist or the user shared their own link
  IF v_owner_id IS NULL OR v_owner_id = p_new_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO friend_requests (from_user_id, to_user_id, status, responded_at)
  VALUES (p_new_user_id, v_owner_id, 'accepted', now())
  ON CONFLICT (from_user_id, to_user_id)
  DO UPDATE SET status = 'accepted', responded_at = now();

  RETURN v_owner_id;
END;
$$;

REVOKE ALL ON FUNCTION auto_friend_from_workout(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION auto_friend_from_workout(uuid, uuid) TO authenticated;
