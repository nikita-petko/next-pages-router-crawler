import formatEnglishHtml from './formatEnglishHtml';
import { decorateEnglishForEnv, getPendingTranslationEnv } from './pendingTranslationEnv';
import type { TPendingHtmlTranslationHelperFunction } from './types';

/**
 * Analogous to `tPendingTranslation`, but accepts the extra `tags` and `args` parameters that
 * `translateHTML` accepts and renders the English fallback through the same algorithm that
 * `@rbx/intl`'s `translateHTML` uses internally.
 *
 * - In non-development environments, delegates to `translateHTML(translationKey, tags, args)`.
 * - On localhost, renders the English fallback with HTML tags and args applied.
 * - On Chromatic, wraps the formatted English fallback in `[!!...!!]` markers.
 * - On sitetest, prefers a loaded HTML translation and uses a marked fallback only when missing.
 *
 * Signature: tPendingHtmlTranslation(english, description, translationKey, tags?, args?)
 */
const tPendingHtmlTranslation: TPendingHtmlTranslationHelperFunction = ({
  ready,
  translateHTML,
}) => {
  return (english, _description, translationKey, tags, args) => {
    const env = getPendingTranslationEnv();
    if (!env.isAllowed) {
      return translateHTML(translationKey, tags, args);
    }

    if (env.preferLoadedTranslations && ready) {
      const translated = translateHTML(translationKey, tags, args);
      if (translated !== '') {
        return translated;
      }
    }

    const decorated =
      env.preferLoadedTranslations && !ready ? english : decorateEnglishForEnv(english, env);
    return formatEnglishHtml(decorated, tags, args);
  };
};
export default tPendingHtmlTranslation;
