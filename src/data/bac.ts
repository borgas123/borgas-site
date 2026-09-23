// BORGAS Asset Creator (BAC) - release and pricing facts for the website.
//
// UPDATE THIS FILE WITH EVERY BAC RELEASE. The download URL must be the signed
// installer that the "Publish BAC update to Cloudflare R2" workflow put on
// updates.borgas.us, and sha256 must match its .sha256 file. Installed copies
// (1.3.0 and later) update themselves from the signed feed at
// https://updates.borgas.us/stable.json, so this page is only for new buyers.
//
// PURCHASING: online checkout for BAC is not live. Until it is, buyers email
// hello@borgas.us and BORGAS sends a PayPal invoice and the license key by
// hand. When checkout opens, set checkoutLive=true and wire the shop.

export const bac = {
  version: "1.3.0",
  released: "2026-09-23",
  download: "https://updates.borgas.us/BORGAS_Asset_Creator_1.3.0-Setup.exe",
  sha256: "990c9503a09fb1ee9f00c01a3fef4684b6d0b00b5e046f8182f0523dc70d6646",
  sizeMB: 0.7,
  publisher: "Devin Tague",            // name on the Authenticode signature

  launchPrice: 100,                     // USD, first 100 buyers (owner, 2026-09-22)
  regularPrice: 150,                    // USD, after the first 100 buyers
  launchLimit: 100,
  // Launch licenses left, copied by hand from BAC_Sales_Tracker.xlsx
  // (Summary > Launch-price spots left). null hides the counter.
  launchLeft: null as number | null,

  checkoutLive: false,
} as const;
