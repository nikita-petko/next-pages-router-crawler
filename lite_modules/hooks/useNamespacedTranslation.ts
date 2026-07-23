import { useTranslation as useBaseTranslation } from '@rbx/intl';
import { captureMessage } from '@sentry/nextjs';
import { ReactNode, useCallback } from 'react';

import { failedNamespaces } from '@components/locale/TranslationResourceProvider';
import { TranslationNamespace } from '@constants/localization';
import { LinkTag } from '@type/translation';

const reportedKeys = new Set<string>();

const reportMissingKey = (qualifiedKey: string): void => {
  if (reportedKeys.has(qualifiedKey)) {
    return;
  }
  reportedKeys.add(qualifiedKey);

  // Skip reporting when any namespace JSON failed to load — those missing keys
  // are false positives caused by the resource fetch failure, not genuinely
  // absent translations.
  if (failedNamespaces.size > 0) {
    return;
  }

  captureMessage(`Missing translation key: "${qualifiedKey}"`, {
    level: 'warning',
  });
};

/**
 * Namespace-bound wrapper around `@rbx/intl` `useTranslation`. Callers pick a
 * `TranslationNamespace` once and then call `translate(key)` / `translateHTML(key)`
 * without repeating the namespace. Lookups are resolved against exactly that
 * namespace via `translateWithNamespace`, so a key that exists in multiple loaded
 * namespaces is never resolved by ambiguous last-wins ordering.
 *
 * Missing keys are reported to Sentry (the underlying library returns `""` with
 * only a `console.warn`, which is easy to miss in production).
 *
 * Components that need keys from more than one namespace call this hook once per
 * namespace with descriptive aliases, e.g.
 * `const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);`
 * `const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);`
 */
const useNamespacedTranslation = (namespace: TranslationNamespace) => {
  const { ready, translateWithNamespace, translateWithNamespaceHTML } = useBaseTranslation();

  const translate = useCallback(
    (key: string, args?: Record<string, string>): string => {
      if (!key) {
        return '';
      }
      const result = translateWithNamespace(namespace, key, args);
      if (ready && result === '') {
        reportMissingKey(`${namespace}::${key}`);
        return key;
      }
      return result;
    },
    [ready, translateWithNamespace, namespace],
  );

  const translateHTML = useCallback(
    (
      key: string,
      tags?: LinkTag[] | null,
      args?: Record<string, string | ReactNode>,
    ): ReactNode => {
      if (!key) {
        return '';
      }
      const result = translateWithNamespaceHTML(namespace, key, tags, args);
      if (ready && result === '') {
        reportMissingKey(`${namespace}::${key}`);
        return key;
      }
      return result;
    },
    [ready, translateWithNamespaceHTML, namespace],
  );

  return { ready, translate, translateHTML };
};

export default useNamespacedTranslation;
