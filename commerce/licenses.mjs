// BORGAS Asset Creator purchase keys, issued by the Worker after a verified payment.
//
// This must produce exactly what BAC's server/bac_license.py verifies:
// the signed bytes are Python's json.dumps(doc, sort_keys=True,
// separators=(",", ":"), ensure_ascii=True) of every field except
// "signature", signed with Ed25519; the key is "BAC1-" + base64url(JSON of the
// whole document) without padding. commerce/licenses.test.mjs cross-checks a
// key signed here against the Python verifier.
//
// Secrets (Worker secrets, never committed):
//   LICENSE_SIGNING_KEY  base64 of the 32-byte Ed25519 seed (the pilot.secret file)
// Vars:
//   LICENSE_PUBLIC_KEY   base64 of the matching public key, identical to
//                        PUBLIC_KEY_B64 in BAC. Every key is verified against it
//                        before it is stored, so a wrong secret never reaches a buyer.

export const PRODUCT = 'BORGAS Asset Creator';
export const EDITION = 'indie';
export const FEATURES = ['commercial-use', 'export', 'finish', 'generate', 'qa'];   // sorted, = FEATURES_BY_EDITION['indie']

const bytesToB64 = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); };
const b64ToBytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

// Python json.dumps(..., sort_keys=True, separators=(",",":"), ensure_ascii=True).
export function canonicalJson(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('Only integers are allowed in a license.');
    return String(value);
  }
  if (typeof value === 'string') {
    // JSON.stringify escapes quote, backslash and control characters the same way
    // Python does; Python additionally escapes every non-ASCII UTF-16 unit.
    return JSON.stringify(value).replace(/[\u007f-￿]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => canonicalJson(k) + ':' + canonicalJson(value[k])).join(',') + '}';
  }
  throw new Error('Unsupported value in a license.');
}

export function signedPayload(doc) {
  const body = { ...doc };
  delete body.signature;
  return new TextEncoder().encode(canonicalJson(body));
}

export function encodeKey(doc) {
  const raw = new TextEncoder().encode(canonicalJson(doc));
  return 'BAC1-' + bytesToB64(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signingKey(seedB64) {
  const seed = b64ToBytes(seedB64 || '');
  if (seed.length !== 32) throw new Error('LICENSE_SIGNING_KEY must be the base64 of a 32-byte Ed25519 seed.');
  // PKCS#8 wrapper for a raw Ed25519 seed (RFC 8410).
  const pkcs8 = new Uint8Array([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20, ...seed]);
  return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'Ed25519' }, false, ['sign']);
}

export async function verifyLicense(doc, publicKeyB64) {
  const raw = b64ToBytes(publicKeyB64 || '');
  if (raw.length !== 32) return false;
  const key = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
  return crypto.subtle.verify({ name: 'Ed25519' }, key, b64ToBytes(doc.signature || ''), signedPayload(doc));
}

export function licensingReady(env) {
  return b64ToBytes(env.LICENSE_SIGNING_KEY || '').length === 32 && b64ToBytes(env.LICENSE_PUBLIC_KEY || '').length === 32;
}

// A signed indie license for one buyer, the same shape `license_tool.py issue` makes.
export async function makeLicense({ licensee, orderId, licenseId, issuedAt, notes = '' }, env) {
  if (typeof licensee !== 'string' || !licensee.trim()) throw new Error('A licensee name is required.');
  const doc = {
    schema: 1,
    licenseId,
    product: PRODUCT,
    licensee: licensee.trim().slice(0, 100),
    edition: EDITION,
    seats: 1,
    issuedAt,
    expiresAt: null,
    features: [...FEATURES],
    notes,
    orderId,
  };
  const key = await signingKey(env.LICENSE_SIGNING_KEY);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'Ed25519' }, key, signedPayload(doc)));
  doc.signature = bytesToB64(sig);
  if (!(await verifyLicense(doc, env.LICENSE_PUBLIC_KEY))) {
    throw new Error('The license signing key does not match LICENSE_PUBLIC_KEY; no key was issued.');
  }
  return { doc, key: encodeKey(doc) };
}
