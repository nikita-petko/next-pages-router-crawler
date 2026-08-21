/**
 * Crude `BigInt` stand-in for browsers that ship without it (Safari < 14).
 * Dependencies that call `BigInt(...)` while their module body evaluates — zod's
 * `BIGINT_FORMAT_RANGES` is the one that bites us — otherwise kill the app with
 * `ReferenceError: Can't find variable: BigInt` before anything renders.
 *
 * Not a real polyfill: values are coerced to `number`, so precision is lost past
 * `Number.MAX_SAFE_INTEGER` and `typeof value === 'bigint'` is never true. It only
 * buys us a page that boots.
 */

type BigIntValue = bigint | boolean | number | string;

// Not an arrow: it has to be callable without `new`, and needs the implicit
// `.prototype` object so `BigInt.prototype.*` access doesn't throw.
function bigIntPolyfill(value: BigIntValue): number {
  return Number(value);
}

const unsupported = (method: string) => (): never => {
  throw new Error(`BigInt.${method} is not supported by the BigInt polyfill`);
};

bigIntPolyfill.asIntN = unsupported('asIntN');
bigIntPolyfill.asUintN = unsupported('asUintN');

// Runs on import; exported so tests can drive it directly.
export const installBigIntPolyfill = (): void => {
  if (typeof globalThis.BigInt !== 'undefined') {
    return;
  }

  // `defineProperty` avoids the unsafe cast a plain assignment would need, and
  // matches the native descriptor.
  Object.defineProperty(globalThis, 'BigInt', {
    value: bigIntPolyfill,
    writable: true,
    configurable: true,
  });
};

installBigIntPolyfill();
