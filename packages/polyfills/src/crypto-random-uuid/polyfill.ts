/**
 * `crypto.randomUUID` is Safari 15.4+. Implemented via `crypto.getRandomValues`
 * which is available in Safari 11+.
 */

function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version 4 (0100) in bits 12–15 of time_hi_and_version
  bytes[6] = (bytes[6] & 15) | 0x40;
  // Set variant 1 (10xx) in bits 6–7 of clock_seq_hi_and_reserved
  bytes[8] = (bytes[8] & 63) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const installCryptoRandomUUIDPolyfill = (): void => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return;
  }

  if (typeof crypto === 'undefined') {
    return;
  }

  Object.defineProperty(crypto, 'randomUUID', {
    value: randomUUID,
    writable: true,
    configurable: true,
  });
};

installCryptoRandomUUIDPolyfill();
