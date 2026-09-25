// BORGAS Asset Creator (BAC) - release and pricing facts for the website.
//
// UPDATE THIS FILE WITH EVERY BAC RELEASE. The download URL must be the signed
// installer that the "Publish BAC update to Cloudflare R2" workflow put on
// updates.borgas.us, and sha256 must match its .sha256 file. Installed copies
// (1.3.0 and later) update themselves from the signed feed at
// https://updates.borgas.us/stable.json, so this page is only for new buyers.
//
// PURCHASING: BAC is sold through the borgas.us shop (opened 2026-09-23). The
// production Worker issues the license key after payment; it appears on the
// buyer's account page. checkoutLive=false returns to email/invoice sales.

export const bac = {
  version: "1.23.0",
  released: "2026-09-25",
  download: "https://updates.borgas.us/BORGAS_Asset_Creator_1.23.0-Setup.exe",
  sha256: "6c0dcb683c4ac4afb8478cd101387b8b622315052453109267f6f3be8b198ce4",
  sizeMB: 1.0,
  publisher: "Devin Tague",            // name on the Authenticode signature

  launchPrice: 100,                     // USD, first 100 buyers (owner, 2026-09-22)
  regularPrice: 150,                    // USD, after the first 100 buyers
  launchLimit: 100,
  // Launch licenses left, copied by hand from BAC_Sales_Tracker.xlsx
  // (Summary > Launch-price spots left). null hides the counter.
  launchLeft: null as number | null,

  checkoutLive: true,
} as const;
