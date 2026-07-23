import type { FormattedText, TPendingTranslationHelperFunction } from './types';

/**
 * Generates a helper function used until translation strings are registered.
 * Returns the English string directly in dev/Chromatic, delegates to `translate` otherwise.
 *
 * Signature: tPendingTranslation(english, description, translationKey, args?)
 */
const tPendingTranslation: TPendingTranslationHelperFunction = ({ translate }) => {
  return (english, _description, translationKey, args) => {
    const isSSR = typeof window === 'undefined';
    if (isSSR) {
      return translate(translationKey, args);
    }

    const isChromatic = window.location.hostname.match(
      /^[a-zA-Z0-9-]+\.(?:capture-loopback\.)?chromatic\.com$/,
    );
    const isLocalhost = window.location.hostname.indexOf('localhost') !== -1;
    const isAllowed = isChromatic || isLocalhost;
    const isDangerous = isChromatic;
    if (!isAllowed) {
      return translate(translationKey, args);
    }
    if (isDangerous) {
      return `[!!${english}!!]` as FormattedText;
    }
    return english as FormattedText;
  };
};
export default tPendingTranslation;
