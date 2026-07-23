const STABLE_FINGERPRINT_HASH_MOD = 18446744073709551557n; // a 64-bit prime
const STABLE_FINGERPRINT_HASH_BASE = 257n;

const stableFingerprint = (value: unknown): string => {
  const hashCanonicalStringHex = (input: string): string => {
    const bytes = new TextEncoder().encode(input);

    // Deterministic rolling hash (no bitwise ops; eslint no-bitwise).
    // This is not cryptographic, but sufficient for change detection.
    let hash = 0n;
    bytes.forEach((b) => {
      hash = (hash * STABLE_FINGERPRINT_HASH_BASE + BigInt(b) + 1n) % STABLE_FINGERPRINT_HASH_MOD;
    });
    return hash.toString(16).padStart(16, '0');
  };

  const canonicalize = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(canonicalize);
    }
    if (typeof input !== 'object' || input == null) {
      return input;
    }
    const record = input as Record<string, unknown>;
    return Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, canonicalize(record[key])] as const);
  };

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return hashCanonicalStringHex(JSON.stringify(canonicalize(parsed)));
    } catch {
      return hashCanonicalStringHex(value);
    }
  }

  try {
    return hashCanonicalStringHex(JSON.stringify(canonicalize(value)));
  } catch {
    return hashCanonicalStringHex(String(value));
  }
};

export default stableFingerprint;
