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
  version: "1.7.0",
  released: "2026-09-24",
  download: "https://updates.borgas.us/BORGAS_Asset_Creator_1.7.0-Setup.exe",
  sha256: "3fb7a2e78703687357a6f43c018d9fb628b24500bcb78efe819e3ba6bc7a4f37",
  sizeMB: 0.7,
  publisher: "Devin Tague",            // name on the Authenticode signature

  launchPrice: 100,                     // USD, first 100 buyers (owner, 2026-09-22)
  regularPrice: 150,                    // USD, after the first 100 buyers
  launchLimit: 100,
  // Launch licenses left, copied by hand from BAC_Sales_Tracker.xlsx
  // (Summary > Launch-price spots left). null hides the counter.
  launchLeft: null as number | null,

  checkoutLive: true,
} as const;
