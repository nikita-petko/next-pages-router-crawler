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

// `globalThis` only exists from Safari 12.1 / Chrome 71 / Opera 58, but
// `.browserslistrc` declares safari 12 / chrome 64 / opera 51. Resolve the
// global safely so these browsers still reach the unsupported-browser page.
// `self` has been available in all browsers since IE4.
interface PolyfillTarget {
  BigInt?: unknown;
}
function resolveGlobal(): PolyfillTarget | undefined {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  return undefined;
}
const polyfillTarget = resolveGlobal();

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
  if (!polyfillTarget || typeof polyfillTarget.BigInt !== 'undefined') {
    return;
  }

  Object.defineProperty(polyfillTarget, 'BigInt', {
    value: bigIntPolyfill,
    writable: true,
    configurable: true,
  });
};

installBigIntPolyfill();
