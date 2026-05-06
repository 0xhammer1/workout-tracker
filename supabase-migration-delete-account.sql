-- Allows a user to permanently delete their own account.
-- SECURITY DEFINER lets the function run as the DB owner so it can
-- delete from auth.users; the WHERE clause pins it to the calling user.
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

-- Only authenticated users can call this.
REVOKE ALL ON FUNCTION delete_own_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
