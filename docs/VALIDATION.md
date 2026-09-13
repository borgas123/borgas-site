# Validation — September 13, 2026
- Astro production build: PASS, 13 static pages.
- Astro/TypeScript check: 0 errors, 0 warnings, 0 hints.
- Headless Google Chrome via Playwright: all 4 test groups pass.
- Every public route inspected at 320, 390, 768, 1024 and 1440 CSS px: no horizontal document overflow.
- All 13 routes checked with axe WCAG 2 A/AA, 2.1 AA and 2.2 AA rules: no reported violations. Automated coverage is not certification or a screen-reader test.
- Mobile menu keyboard Enter/Escape/focus restoration: pass.
- Catalog URL preselection, family selection and browser Back: pass.
- JavaScript disabled: mobile navigation visible and BRC-02 inquiry URL usable.
- Local links and linked assets: resolve to built files. Public output contains no draft/incubation products, local paths, private register or withheld service screenshots.
- Contact development layout: BRC-02 and Purchase inquiry preselected correctly; malformed email fails native validity; submission remains disabled without a recipient. No email was sent.
- Desktop/mobile screenshots of home and BRC-02 visually inspected. Lazy images explicitly loaded before final captures. Full original raven retained.
- Homepage at 320 CSS px with 200% base text size: reflows after fixing grid minimum sizing.
- Local unthrottled mobile Chrome observation (390 x 844): initial encoded resources plus HTML 172,523 bytes; homepage first-party inline JavaScript gzip 366 bytes; LCP 276 ms; CLS 0. These are local lab observations, not field Core Web Vitals or throttled mobile results. INP was not measured.
- External distribution verified through GitHub API: public latest release BFD-01-1.2.3 exists with binary and index. Site links to the release repository rather than pinning a version that may become stale.
- Component reference exists only in development at /_preview/components; production generates no preview route.
- Font licenses bundled. No analytics or external font requests configured.

Remaining: real email acceptance/delivery test after recipient is supplied; direct server submission backend if desired; manual screen-reader and physical-device testing; live-domain HTTPS/deployment checks; owner review of content/assets.
Local screenshots and metrics: qa-artifacts (ignored by Git). Production package: qa-artifacts/borgas-site-preview.zip. Existing live site has not been changed.

## Direct Windows downloads — 2026-09-13
Support now links directly to two installer assets in BORGAS-Windows-Installers-2026-09-13. The release is explicitly not latest, preserving the firmware updater's latest-index source.
Device Manager installer contains the exact published 1.2.3 app and USB flashing tools. LED installer contains all preview/font assets. Both Chrome downloads completed and stayed on Support; hashes matched published files. Build, type checks and browser/accessibility checks passed. Fresh-PC installation testing remains outstanding.
