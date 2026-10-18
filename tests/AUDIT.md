# 2026-10-18 audit

Fixed: saveAll previously wrote only localStorage. It now saves an atomic account snapshot and queryable workout/rest days through save_gym_state, checks the resulting revision, and only then reports cloud success. Failed saves retain a pending local copy; initial cloud-read failures cannot overwrite cloud records. Concurrent-device saves reject stale revisions. Unsent local data is reconciled explicitly using the backup preview. Bulk writes remain manual.

Database: gym_account_state uses owner RLS. workout_logs has a unique member/date index. The RPC runs as SECURITY INVOKER; existing workout ownership policies remain enforced. Revoke browser TRUNCATE privileges and direct execution of internal trigger functions.

Membership: deployed previously missing invite-member function, which validates the bearer token with Auth and checks the admin profile before any privileged action. New invitations associate members with the inviting admin. No real invitations sent during the audit.

Validation:
- `node tests/audit.cjs`: navigation, set values/volume, save and readback, second-device reload, stale-revision conflict, offline pending save/retry, reconciliation, invalid RIR, finish, rest/day removal, program editing/templates, rest timer, bodyweight, generated inline handlers.
- JavaScript syntax checks passed.
- Live SQL transaction under authenticated role: insert/read/update/delete, conflict rejection and cross-account isolation passed; transaction rolled back.
- Unauthenticated invite-member request returned HTTP 401.

Limits: Node tests use simulated DOM/Supabase, not browser clicks. No signed-in browser session or user's phone localStorage was available. SMTP delivery/invitation completion/password reset were not end-to-end tested. Existing user records remain on their device until they press Save (or use legacy import).

Remaining security advisory: leaked password protection is disabled; role helper functions is_admin/is_coach_of are intentionally callable by authenticated users for RLS. They use auth.uid and fixed search_path.
