/**
 * Where Ads Manager caches the last theme mode it actually rendered in.
 *
 * `useResolvedThemeMode` gates the shared Creator Hub preference behind the
 * `isLightModeEnabled` metadata flag, and that metadata arrives over the network.
 * Until it lands the flag reads as `false`, so without a cache every load renders
 * the whole fetch in dark and then flips to light once the response arrives. This
 * key holds the previous answer so a returning user starts on the right side.
 *
 * Deliberately a plain `localStorage` string rather than a `SetLocalStorage`
 * (`ttl-localstorage`) entry: the pre-paint script in `_document.tsx` reads it
 * before any bundle has loaded, so the value has to be readable without the
 * library's envelope, and this cache should never expire.
 *
 * Temporary — delete along with the flag once light mode is fully rolled out.
 */
// eslint-disable-next-line import/prefer-default-export
export const resolvedThemeModeStorageKey = 'ads-manager-resolved-theme-mode';
