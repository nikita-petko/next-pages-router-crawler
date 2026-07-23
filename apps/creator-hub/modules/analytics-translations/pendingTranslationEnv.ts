/**
 * Shared environment helpers used by `tPendingTranslation` and `tPendingHtmlTranslation`.
 *
 * The "pending" translation functions return the original English string on Chromatic and
 * localhost so engineers can iterate without first registering the key. Sitetest/robloxlabs uses
 * loaded translations when available and falls back to English only for missing keys. All other
 * environments delegate to the real translation pipeline.
 *
 * In Chromatic and for confirmed-missing sitetest keys, the English fallback is wrapped in
 * `[!!...!!]` markers so it is visibly distinct from a localized resource.
 */

const CHROMATIC_HOSTNAME_REGEX = /^[a-zA-Z0-9-]+\.(?:capture-loopback\.)?chromatic\.com$/;
const ROBLOXLABS_HOSTNAME_REGEX = /(?:^|\.)robloxlabs\.com$/;

const isRobloxlabsHostname = (hostname: string | undefined): boolean =>
  typeof hostname === 'string' && ROBLOXLABS_HOSTNAME_REGEX.test(hostname);

export type PendingTranslationEnv = {
  /** True when running on the server (no `window`). */
  isSSR: boolean;
  /**
   * True when running in an environment where it is safe to short-circuit to the English string
   * (Chromatic, localhost, or sitetest/robloxlabs). Outside of these environments the real
   * translator must be used so users always see localized content.
   */
  isAllowed: boolean;
  /**
   * True when running on Chromatic or sitetest/robloxlabs. In this mode the English string is
   * wrapped in `[!!...!!]` markers to make unregistered strings obvious.
   */
  isDangerous: boolean;
  /**
   * True when loaded translations should be preferred over the English fallback. Sitetest uses
   * real resources when available while preserving a visibly marked fallback for missing keys.
   */
  preferLoadedTranslations: boolean;
};

export const getPendingTranslationEnv = (): PendingTranslationEnv => {
  if (typeof window === 'undefined') {
    const isRobloxlabs = isRobloxlabsHostname(process.env.robloxSiteDomain);
    return {
      isSSR: true,
      isAllowed: isRobloxlabs,
      isDangerous: isRobloxlabs,
      preferLoadedTranslations: isRobloxlabs,
    };
  }
  const isChromatic = CHROMATIC_HOSTNAME_REGEX.test(window.location.hostname);
  const isLocalhost = window.location.hostname.includes('localhost');
  const isRobloxlabs = isRobloxlabsHostname(window.location.hostname);
  return {
    isSSR: false,
    isAllowed: isChromatic || isLocalhost || isRobloxlabs,
    isDangerous: isChromatic || isRobloxlabs,
    preferLoadedTranslations: isRobloxlabs,
  };
};

/** Wraps the English fallback string for visibility in dangerous environments. */
export const decorateEnglishForEnv = (english: string, env: PendingTranslationEnv): string => {
  return env.isDangerous ? `[!!${english}!!]` : english;
};
