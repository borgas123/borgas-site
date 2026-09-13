# Content guide
Edit src/data/products.ts. New records must default to publish:false. Provide a human name, descriptor, summary, audience, family, lifecycle, ordering state, capabilities, specs, resources and images before enabling publication.
publicProducts() filters drafts at build time and explicitly selects public fields. Build validation rejects missing required copy, duplicate slugs, unconfigured Buy actions and non-HTTPS resource URLs.
Lifecycle describes the build; ordering describes commercial access. Established does not mean in stock. Do not add prices, package contents, performance ratings or compatibility without documented evidence.
Mark planned capabilities as planned. Put unresolved claims and source provenance in the local ignored .private register, never in public data.
Add an image only if cleared for public use. Include accurate alt text and a caption explaining renders/demonstration data. Place approved assets in public/images. Files in public are copied whether referenced or not.
Resources must point to approved public distribution. Prefer the current release listing over an unmaintained direct firmware version. Describe model/revision requirements; do not mirror private engineering repositories.
Contact currently uses a transparent email-draft fallback. Set a verified recipient in site.ts. It opens the visitor's mail client and never claims submission. Test the resulting message manually before launch.
A real web submission service is not configured. Implement and verify server-side validation, spam protection, delivery/acceptance semantics and failure preservation before switching to it; update privacy copy to reflect the provider.
Draft products and incubation concepts stay absent from all output. The four current public records are BRC-02, BRC-FL, BFD-01 and BPS-01.
