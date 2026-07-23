import type { FormattedText } from './types';

/**
 * Substitutes `{argName}` placeholders inside an English string with the values from `args`,
 * matching the runtime behavior of `@rbx/intl`'s `translate(key, args)` (see
 * `packages/intl/src/hooks/useTranslation.ts`).
 *
 * Placeholders without a matching arg are left as-is (e.g. `{unknown}`), again matching the
 * behavior of the real translator.
 *
 * The result is branded as `FormattedText` here, at the construction site, so callers don't
 * need to assert it themselves.
 */

const STRING_ARG_REPLACE_REGEX = /{(.+?)}/g;

const formatEnglishWithArgs = (
  english: string,
  args?: { [key: string]: string },
): FormattedText => {
  if (typeof args === 'undefined' || Object.keys(args).length === 0) {
    return english as FormattedText;
  }
  return english.replace(
    STRING_ARG_REPLACE_REGEX,
    (_, argName) => args[argName] ?? `{${argName}}`,
  ) as FormattedText;
};

export default formatEnglishWithArgs;
