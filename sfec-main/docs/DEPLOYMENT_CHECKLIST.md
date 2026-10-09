# SFEC Web — build and deployment checklist

## Why a successful build may show no visible change

A successful build only proves that the source used by that build can be compiled/validated. It does not publish the result to `sfec.skyfirst.io.vn`. The ZIP must be extracted so that `package.json`, `wrangler.jsonc`, `src/`, `public/`, and `migrations/` are at the repository root. Do not leave them nested under an extra `sfec-main/` directory unless the build root is explicitly set to that directory.

## Before publishing

1. Confirm the GitHub repository's latest commit contains the updated `public/index.html`, `public/app.js`, `public/styles.css`, `src/admin.js`, and `src/public.js`.
2. Confirm the deployment workflow points at this repository and the correct branch/commit, not an older ZIP or another project.
3. Confirm the Worker name is `sfec`, its assets directory is `./public`, and the domain route/custom domain remains `sfec.skyfirst.io.vn`.
4. Review the D1 migration history and create a backup before applying any pending migration. Do not reset, recreate, or overwrite production D1/R2.
5. Deploy only after reviewing secrets/bindings and approval from the owner. A source ZIP itself does not deploy.

## Commands (run from the repository root)

```bash
npm ci
npm run validate
npx wrangler deploy --dry-run
```

If dry-run passes and production deployment is explicitly approved, deploy with the project's normal CI or `npx wrangler deploy`. Do not apply remote migrations merely to fix a frontend-only issue. Migration `0011_email_automation_center.sql` is needed only for the email automation schema and should be applied after verifying backup and migration state.

## Post-deploy smoke checks

- Open `https://sfec.skyfirst.io.vn/` in a private/incognito window and hard refresh.
- Inspect the new navigation: Trang chủ, Giới thiệu, Hoạt động, Bản tin, Tra cứu, Liên hệ; dropdowns must work on desktop and mobile.
- Open the admin login, then Website Studio; verify full-screen mode and local draft recovery.
- Confirm the GCN admin view is read-only for issue/revoke/create actions and the public page has no portrait, download, or print action.
- Test a known code against the authoritative CTT registry, a nonexistent code, and a registry timeout. If the issuer API contract differs, the UI must show “Chưa xác minh được” rather than inventing success.
- Test login, RBAC, forms, uploads, email provider status, a test email, and existing data/history before declaring release complete.

## Release limitation

The source-level changes in this package are not evidence of a production deployment. Email delivery and the live CTT registry contract require environment-level tests.
