import { shouldPolyfill as shouldPolyfillDisplayNames } from '@formatjs/intl-displaynames/should-polyfill.js';
import { shouldPolyfill as shouldPolyfillLocale } from '@formatjs/intl-locale/should-polyfill.js';
// Pinned to v5 — v6+ depends on @formatjs/bigdecimal which uses BigInt literal syntax (0n) unparseable on Safari 12.
import { shouldPolyfill as shouldPolyfillPluralRules } from '@formatjs/intl-pluralrules/should-polyfill.js';
import { shouldPolyfill as shouldPolyfillRtf } from '@formatjs/intl-relativetimeformat/should-polyfill.js';
import { createPolyfillGate } from '../react/createPolyfillGate';

// Short-circuit: when Locale is missing, the other shouldPolyfill functions are
// unsafe to call (they use Intl.Locale internally), so we skip them and load
// everything. JS `||` ensures the right side never evaluates in that case.
// Note: shouldPolyfillLocale() returns boolean; the others return string | undefined.
const needsLocale = shouldPolyfillLocale();
const needsRtf = needsLocale || shouldPolyfillRtf() !== undefined;
const needsPluralRules = needsLocale || shouldPolyfillPluralRules() !== undefined;
const needsDisplayNames = needsLocale || shouldPolyfillDisplayNames() !== undefined;

const needsResizeObserver =
  typeof window !== 'undefined' && typeof window.ResizeObserver !== 'function';

const needsAny = needsRtf || needsPluralRules || needsDisplayNames || needsResizeObserver;

function loadPolyfills(): Promise<unknown> {
  // Intl.Locale must install before RTF/PluralRules/DisplayNames (they use it internally).
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
