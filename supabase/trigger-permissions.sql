-- Internal trigger entrypoints are not browser RPCs.
revoke execute on function public.create_profile_for_new_user() from public,anon,authenticated;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
