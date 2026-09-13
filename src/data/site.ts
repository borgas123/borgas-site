// Site configuration. The three values below that depend on the business
// registration are empty on purpose; the pages that use them render an
// honest state (no dead link, no invented address) until they are set.

export const site = {
  name: "BORGAS",
  domain: "https://borgas.us",
  tagline: "Electronics with purpose.",

  // Set once the legal entity exists, exactly as registered.
  legalName: "",

  // Set once Cloudflare Email Routing (or a mailbox) exists on the domain.
  // NEVER guessed: the brief forbids inventing an address on an assumed domain.
  contactEmail: "",

  // The runtime endpoint the contact form posts to. Empty means the form is
  // not offered and the page falls back to email (if that exists).
  contactEndpoint: "",

  // Approved public links only.
  links: {
    firmware: "https://github.com/borgas123/borgas-firmware",
  },
} as const;
