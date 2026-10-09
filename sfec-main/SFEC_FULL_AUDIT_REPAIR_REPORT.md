# SFEC — source audit and repair report

Date: 2026-10-09

## Source of truth

The working source was based on `sfec-immersive-rebuild(1).zip`. The file and its duplicate upload were byte-identical (SHA-256 `65607daa9f430bd2d53e89c876aca2a8c2c5299057602d35682e3f213e356a6a`). This release ZIP is packaged with the project files at the archive root to reduce the risk of building from an unintended nested directory.

## Changes included in this repair package

- Updated the public navigation to use the requested top-level destinations and grouped dropdowns; the public header labels the account entry “Đăng nhập”, not “Quản trị”.
- Expanded public information for the SFEC/SFN relationship, public classes, events, news, contact, governance, transparency, and certificate verification. The content explicitly avoids inventing classes, events, staff, outcomes, or participation numbers.
- Added CMS editor full-screen mode, browser-local draft autosave, and a restore-draft control. Drafts stay in the same browser/device and are cleared after a successful server save.
- Replaced the remaining native browser `prompt()`, `confirm()`, and `alert()` flows in the admin/member interface with SFEC-styled modal dialogs, including validation for numeric evaluation scores and HTTP(S) CMS links.
- Removed SFEC authority to create, issue, edit, or revoke GCN/GXN at the API boundary regardless of role grants. The admin GCN view is now read-only for historical records; issue/revoke/create UI actions were removed. Existing records and schema are preserved.
- Changed public GCN lookup to query the authoritative CTT endpoints first, normalizes common status values, strips private fields, and returns unavailable rather than treating the local SFEC database as an authoritative issuer when the external service cannot be verified.
- Preserved the earlier email center work: provider configuration, template configuration, email logs/retry support, Times New Roman templates, and migration `0011_email_automation_center.sql`.
- Added a deployment checklist explaining repository root, build versus deploy, production database safety, and post-deploy smoke tests.

## Checks run in this workspace

- `node scripts/validate.mjs` — passed after repairs.
- `node --check` on the Worker modules and public app — passed.
- ESM import smoke tests for `src/index.js`, `src/admin.js`, `src/public.js`, `src/auth.js`, `src/me.js`, `src/email.js`, and `src/permissions.js` — passed.
- SQLite test database applied migrations `0001` through `0011` — passed; re-running migration `0011` — passed; 16 templates and 16 template-config records present after migration.
- Source archive uses the original source file's SHA-256 listed above.

## Not represented as complete / still needs environment verification

- No production deployment was performed from this workspace. A green build does not prove the Worker or static assets were deployed to `sfec.skyfirst.io.vn`. This environment also did not have an installed Wrangler CLI for a Cloudflare dry-run.
- The CTT API contract could not be live-verified from this workspace. Test valid, nonexistent, revoked, timeout, and legacy codes against the real issuer before release. If response fields differ, update the adapter based on actual response samples.
- No live email was delivered; provider credentials/bindings and sender-domain authentication must be tested in the target Cloudflare environment.
- Full end-to-end browser tests for login, every RBAC role, forms, QR camera/image fallback, uploads/R2, and all admin CRUD paths remain release gates. The source validator now fails if native browser `prompt()`, `confirm()`, or `alert()` calls return.
- Verify every individual page's content, mobile layout, and accessibility with a real browser and current production data before claiming the entire website audit is complete.

## Safety notes

Do not reset or recreate D1/R2. Do not deploy migrations without a production backup and a review of the existing migration history. No Android/APK/native-app work is included. No claim is made that this source has been deployed.
