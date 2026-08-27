import { createPolyfillGate } from '../react/createPolyfillGate';

// Plain feature detection, deliberately NOT formatjs's `shouldPolyfill()` helpers.
//
// Those helpers also probe for engine conformance bugs, so they ask us to polyfill working native
// implementations. `@formatjs/intl-displaynames`'s `hasScriptBug()` checks that lowercase 'arab'
// canonicalizes to 'Arabic' per ECMA-402 CanonicalCodeForDisplayNames (formatjs#5889). Node v24
// fails that check while Chrome 151 passes it, so server and client disagreed about whether a
// polyfill was needed — and nothing in this repo uses `type: 'script'` display names anyway.
//
// Policy: if a native implementation exists, use it. We only polyfill what is actually missing.
// The trade-off is that engine conformance bugs are no longer papered over; if one bites a real
// feature, fix it at the call site rather than by loading a polyfill for every user.
//
// Each constructor is detected independently. The previous implementation short-circuited all of
// these on `needsLocale` because formatjs's `shouldPolyfill()` helpers were unsafe to *call* without
// Intl.Locale (they use it internally). A `typeof` check cannot throw, so that coupling is gone —
// and it over-polyfilled: Intl.PluralRules shipped in Safari 13 but Intl.Locale only in Safari 14,
// so Safari 13 would have replaced a working native PluralRules. `loadPolyfills` still installs
// Intl.Locale before the others, which is the ordering constraint that does matter.
const hasIntl = typeof Intl !== 'undefined';
const needsLocale = !hasIntl || typeof Intl.Locale === 'undefined';
const needsRtf = !hasIntl || typeof Intl.RelativeTimeFormat === 'undefined';
const needsPluralRules = !hasIntl || typeof Intl.PluralRules === 'undefined';
const needsDisplayNames = !hasIntl || typeof Intl.DisplayNames === 'undefined';

const needsResizeObserver =
  typeof window !== 'undefined' && typeof window.ResizeObserver !== 'function';

// `needsLocale` must be included: it no longer implies the others now that detection is
// independent, so a browser missing only Intl.Locale would otherwise never load its polyfill.
const needsAny =
  needsLocale || needsRtf || needsPluralRules || needsDisplayNames || needsResizeObserver;

function loadPolyfills(): Promise<unknown> {
  // Intl.Locale must install before RTF/PluralRules/DisplayNames — do NOT parallelize these.
  //
  // The dependency is not in those implementations; it is in their `polyfill.js` entry points,
  // which call formatjs's own `shouldPolyfill()` at module scope. When the native constructor is
  // missing, that falls through to `match()` from @formatjs/intl-localematcher, which runs
  // `new Intl.Locale(...).maximize()`.
  //
  // Verified by deleting Intl.Locale and importing each polyfill: all three throw
  // "Intl.Locale is not a constructor". DisplayNames is the worst case — it throws *after*
  // assigning Intl.DisplayNames, leaving it polyfilled with no locale data.
  //
  // Non-forced variants feature-detect internally, so native implementations aren't clobbered.
  const intlReady: Promise<unknown> = (
    needsLocale ? import('@formatjs/intl-locale/polyfill.js') : Promise.resolve()
  ).then(() =>
    Promise.all([
      needsRtf
        ? import('@formatjs/intl-relativetimeformat/polyfill.js').then(
            () => import('@formatjs/intl-relativetimeformat/locale-data/en.js'),
          )
        : null,
      needsPluralRules
        ? import('@formatjs/intl-pluralrules/polyfill.js').then(
            () => import('@formatjs/intl-pluralrules/locale-data/en.js'),
          )
        : null,
      needsDisplayNames
        ? import('@formatjs/intl-displaynames/polyfill.js').then(
            () => import('@formatjs/intl-displaynames/locale-data/en.js'),
          )
        : null,
    ]),
  );

  // Non-Intl polyfills have no ordering dependency — load concurrently.
  return Promise.all([
    intlReady,
    needsResizeObserver ? import('../resize-observer/polyfill') : null,
  ]);
}

export const usePolyfills = createPolyfillGate(needsAny, loadPolyfills);
