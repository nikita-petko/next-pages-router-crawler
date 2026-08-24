/**
 * `Object.hasOwn` is Safari 15.4+. `@rbx/intl` uses it on the translation path
 * (useTranslation, TranslationResourceProviderBase), so without this the app
 * crashes with `TypeError: Object.hasOwn is not a function` once translations load.
 */

function hasOwn(target: object, property: PropertyKey): boolean {
  // oxlint-disable-next-line eslint/prefer-object-has-own -- this IS the polyfill
  return Object.prototype.hasOwnProperty.call(target, property);
}

// Runs on import; exported so tests can drive it directly.
export const installObjectHasOwnPolyfill = (): void => {
  if (typeof Object.hasOwn === 'function') {
    return;
  }

  Object.defineProperty(Object, 'hasOwn', {
    value: hasOwn,
    writable: true,
    configurable: true,
  });
};

installObjectHasOwnPolyfill();
