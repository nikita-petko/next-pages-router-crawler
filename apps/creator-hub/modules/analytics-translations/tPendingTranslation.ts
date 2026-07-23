import formatEnglishWithArgs from './formatEnglishWithArgs';
import { decorateEnglishForEnv, getPendingTranslationEnv } from './pendingTranslationEnv';
import type { TPendingTranslationHelperFunction } from './types';

/**
 * Generates a helper function used until translation strings are registered.
 * Returns an English fallback (with `{argName}` interpolation) in development environments.
 * Sitetest prefers a loaded translation and uses a marked fallback only when the key is missing;
 * production delegates directly to `translate`.
 *
 * Signature: tPendingTranslation(english, description, translationKey, args?)
 */
const tPendingTranslation: TPendingTranslationHelperFunction = ({ ready, translate }) => {
  return (english, _description, translationKey, args) => {
    const env = getPendingTranslationEnv();
    if (!env.isAllowed) {
      return translate(translationKey, args);
    }

    if (env.preferLoadedTranslations && ready) {
      const translated = translate(translationKey, args);
      if (translated.length > 0) {
        return translated;
      }
    }

    const decorated =
      env.preferLoadedTranslations && !ready ? english : decorateEnglishForEnv(english, env);
    return formatEnglishWithArgs(decorated, args);
  };
};
export default tPendingTranslation;
