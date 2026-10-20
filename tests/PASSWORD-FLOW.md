# Password flow repair — 2026-10-20

Scope: login.html, callback forwarding in auth-guard.js, index cache version.
No database migration, user deletion, role change, or workout mutation.

Fixed locally:
- Forward email callbacks received at index.html before creating an Auth client.
- Explicitly verify invite/recovery token hashes, implicit sessions and PKCE codes.
- Reject invalid credentials instead of using an unrelated existing session.
- Preserve unfinished password setup across refresh, tied to verified user ID for one hour.
- Keep password recovery accessible to signed-in accounts and offer password creation/change.
- Clear credentials from URL and disable referrer transmission on the login page.

Verification: `node tests/auth-password.cjs` — 18 checks passed with mocked Auth.
This is not a real email/Auth E2E test. Not approved as production-ready by these tests alone.

Hosted Auth logs show successful recovery email delivery and verification, expired/used
tokens, and localhost:3000 referer values. The referer alone does not establish the actual
configured redirect URL. Read Dashboard settings before attributing the failure solely
to configuration.

Remaining release gate:
1. Inspect production Auth URL Configuration and email templates via Dashboard.
2. Site URL should be https://kaanaydin48.github.io/Gym/login.html and allow the exact
   https://kaanaydin48.github.io/Gym/login.html redirect. Preserve any valid existing URLs.
3. Test invitation and recovery with isolated staging Auth users, using actual email links.
4. Confirm password creation, refresh, fresh password login, expired-link error, and existing
   account isolation. Then release only these frontend changes.

Token-hash email templates are supported by this patch, but existing ConfirmationURL
templates remain compatible. Do not change templates until the callback code is published.
No template or Auth configuration was changed during this patch.
