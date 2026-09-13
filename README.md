# BORGAS website

Astro + TypeScript company website for https://borgas.us. Work in this repository; firmware and product engineering remain in their own repositories.

## Local use
Requires Node 22.12 or newer (Node 24 used for validation).
```
npm ci
npm run dev -- --host 127.0.0.1
npm run check
npm run build
npm run preview -- --host 127.0.0.1
```
Development serves the contact layout even without a recipient, clearly marked as preview only. Production omits an unconfigured form.

## Editing
Use src/data/products.ts for public product records and src/data/site.ts for contact/domain configuration. See docs/CONTENT_GUIDE.md. Do not add private source references to public records, assets, or this public Git repository. Local evidence is in .private/content-register.md (ignored by Git).

## Deployment
The existing live site is a legacy GitHub Pages deployment. This Astro conversion has not changed it.
The manual .github/workflows/deploy.yml builds and deploys dist with GitHub Actions. Before first deployment:
1. Complete docs/LAUNCH_CHECKLIST.md and review the preview.
2. Commit reviewed site source to the website repository.
3. In GitHub Settings > Pages, change Source to GitHub Actions. Preserve borgas.us as the custom domain.
4. Run Deploy website manually from Actions on the reviewed branch.
5. Verify domain DNS, certificate issuance, HTTPS enforcement, deep links and 404.
The workflow is intentionally manual during launch review. Cloudflare remains the domain/DNS provider; this static site needs no hosting migration.

Astro hosting reference: https://docs.astro.build/en/guides/deploy/github/

## Recovery
The original homepage remains in _legacy_index.html; original committed state is available in Git history. Keep the last good commit. To roll back a deployment, run the deployment workflow at a reviewed previous version, or restore a previous version with a new commit and deploy. Do not rewrite shared history.

## Checks
npm run check validates Astro/TypeScript.
npm run build validates public product requirements and creates static output.
npm run test:site starts a local production preview and checks every route at five viewport widths, local assets/links, draft exclusion, keyboard menu, filters/history, metadata and automated accessibility. Requires Google Chrome installed.
For contact layout checks, start the development server and run npm run test:contact. This checks the unconfigured preview, not email delivery.
