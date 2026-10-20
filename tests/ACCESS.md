# Assigned-program access — 19 October 2026

Status: implementation branch, NOT deployed. Production Auth, schema, data and main are unchanged.

## 20 October continuation / deployment block

The coach dashboard is now implemented: member search, active/inactive tracking filters, pending invitations from Auth confirmation state, last workout, active program count, restricted profile details, calendar, kg/reps/RIR, external/bodyweight volume, PRs and private coach notes. Activity status labels tracking only; it does not ban Auth access. The existing invitation resend/cancellation/expiry feature is still outstanding.

All four local suites passed, including 68 actual PostgreSQL/PGlite assertions. A private pre-deployment backup was added to the migration. Production preflight still found 4 workout rows and 1 snapshot, with unchanged checksums from the audit.

The user authorized live publication without further confirmation. However, automatic approval review rejected the production `member_program_access` migration: broad RLS/grant/RPC changes and member-snapshot changes without hosted E2E evidence were judged insufficiently controlled. No migration or frontend release was applied. Do not bypass this block by issuing the same SQL through another endpoint or splitting it to evade review. A real staging verification and a fresh authorized deployment review remain necessary.

## Behavior

- Members load active assignments joined to active programs. No assignments gives `Henüz antrenman programı atanmadı`. A network error gives an error/retry state, never personal/default programs.
- Assigned programs are separate from personal templates and historical day snapshots. Existing calendar, set entry, animation cards, timer, progress and manual save remain in use.
- Staff open Programs → Koç yönetimi. They can copy a personal program to the cloud, edit it with the existing editor, assign it, and deactivate/reactivate programs or assignments.
- Admin sees/manages all programs. Coaches manage own templates or programs actively assigned exclusively to their authorized members. Shared programs affecting another coach's members require admin editing. Private unassigned templates of other coaches are not visible.
- Coach relationship is the authoritative `profiles.coach_id`; roles come from the database, not editable Auth metadata.
- Members may change their logged kg/reps/RIR/done values. New workouts require an active own assignment and matching current program version/structure. Previously saved workouts retain their exact structure and may still have results corrected after assignment deactivation or program edits.
- Direct snapshot/log API writes are revoked. `save_gym_state` calls a private checked transaction that authenticates, locks the user's snapshot, checks revision, checks member structures, and writes the two representations atomically.
- The migration retains all existing workout rows unchanged. Old member templates are copied to a private RLS-protected archive before removal from the member-facing snapshot. Local old state is retained under the account's `:pre-assignment-access` key before sanitization. Admin/coach personal templates are unchanged.
- Existing explicit day deletion remains available; updating a program never deletes days. Program and assignment hard deletion is replaced by deactivation.

## Verification

`npm ci --ignore-scripts && npm test`

1. Existing simulated-DOM regression suite, now loading the access module: navigation, cloud readback/conflicts/offline retry, history, set validation, personal program editor/templates, timer, bodyweights and 40 animations.
2. Member simulated-DOM suite: empty state, active list, private library hidden, edit guards, own result save/reload, offline fail-closed behavior, template update/deactivation preserving days, timer, local archive.
3. PostgreSQL/PGlite suite: executes the actual migration against a synthetic legacy schema and fixture records with `SET ROLE` and `auth.uid()` claims. Tests RLS selections, denied writes, member tampering, missing/foreign/inactive assignments, historical preservation, optimistic revision conflict, coach transfer, admin access, private archive and TRUNCATE denial. These are actual PostgreSQL policy/function checks, not a mocked SQL evaluator.

No production fixtures, emails, users or workout records were created or modified. PGlite uses synthetic Auth claims and is NOT a hosted Supabase Auth/PostgREST/browser end-to-end test.

## Required hosted gate before deployment

The existing project has no development branch; Supabase rejected branch creation because the plan does not support branching. No second project was created or paid upgrade requested. A separate authorized test project is still required for hosted E2E and the earlier invitation work.

1. Export a private backup of schema, grants, policies, function definitions and records. Check current main/schema against the audited baseline. Migration aborts on unfamiliar RLS policies.
2. Reconcile any unsent legacy member workouts before changing access. New unassigned historical imports are intentionally rejected by the server; do not discard local archives to bypass this.
3. In staging, reproduce the existing schema, apply this migration, and verify `gym_private` is NOT in exposed API schemas. Check default function grants and security advisors.
4. Use synthetic admin, two coaches and two members. Test real JWT REST access and browser flows: publish/assign/edit/deactivate, cross-account requests, direct API mutation attempts, private snapshot archive, password/session expiry, second device and offline save. Verify the earlier invite flow independently; it is not implemented by this access patch.
5. Compare completed workout content before/after program edits. Verify staff shared-program editing rules with two coaches. Test old browser clients fail safely and retain pending local copies.
6. Deploy database and frontend in a coordinated window only after hosted tests pass. Bump asset cache versions. Recheck record counts/content and auth/RLS advisors after deployment.

Rollback must preserve new records: do not blindly restore an old snapshot or drop the private archive. Restore reviewed grants/functions and frontend together; reconcile any writes after the backup first. Keep the archive until a separately reviewed retention decision.
