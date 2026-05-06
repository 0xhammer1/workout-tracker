-- ============================================================
-- Extend friend search to also match by display_name.
-- Run after supabase-migration-friends.sql.
-- ============================================================
--
-- Returns up to 10 users whose email starts with the query OR
-- whose display_name contains it (case-insensitive). Excludes
-- the caller's own row. Renamed to search_users since it's no
-- longer email-only.

create or replace function search_users(query text)
returns table (id uuid, email text, display_name text, avatar_url text)
language sql
security definer
set search_path = public, auth
as $$
  with q as (
    select trim(query) as raw, lower(trim(query)) as lc
  )
  select au.id, au.email::text, up.display_name, up.avatar_url
  from auth.users au
  left join public.user_profiles up on up.user_id = au.id
  cross join q
  where au.id <> auth.uid()
    and length(q.raw) >= 2
    and (
      -- exact email match wins
      lower(au.email) = q.lc
      -- otherwise prefix match on email local part
      or au.email ilike q.raw || '%'
      -- or substring match on display name
      or up.display_name ilike '%' || q.raw || '%'
    )
  order by
    case when lower(au.email) = q.lc then 0
         when au.email ilike q.raw || '%' then 1
         else 2
    end,
    up.display_name nulls last,
    au.email
  limit 10;
$$;

revoke all on function search_users(text) from public;
grant execute on function search_users(text) to authenticated;
