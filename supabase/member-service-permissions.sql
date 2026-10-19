-- The invite-member backend reads admin/member profiles and upserts invited member profiles.
-- Only the server-side service role receives these grants; browser roles and RLS are unchanged.
grant select, insert, update on table public.profiles to service_role;
