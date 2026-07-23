import { useMemo } from 'react';
import makeTPendingHtmlTranslation from './tPendingHtmlTranslation';
import makeTPendingTranslation from './tPendingTranslation';
import type { TUseTranslationResult, TWrappedUseTranslationResult } from './types';
import { translateHTMLFn, translationFn } from './wrapperFunctions';

const useTranslationWrapper = (given: TUseTranslationResult): TWrappedUseTranslationResult => {
  const { ready, translate, translateHTML, translateWithNamespace, translateWithNamespaceHTML } =
    given;

  /**
   * We re-memoize here to workaround if the object passed changes when the actual functions don't.
   * (This also simplifies the subsequent implementation of namespace switching.)
   */
  const unwrappedContext = useMemo(() => {
    return { ready, translate, translateHTML, translateWithNamespace, translateWithNamespaceHTML };
  }, [ready, translate, translateHTML, translateWithNamespace, translateWithNamespaceHTML]);

  const result = useMemo((): TWrappedUseTranslationResult => {
    const preResult: Omit<
      TWrappedUseTranslationResult,
      'tPendingTranslation' | 'tPendingHtmlTranslation'
    > = {
      ready: unwrappedContext.ready,
      translate: translationFn(unwrappedContext),
      translateHTML: translateHTMLFn(unwrappedContext),
      translateWithNamespace: unwrappedContext.translateWithNamespace,
      translateWithNamespaceHTML: unwrappedContext.translateWithNamespaceHTML,
    };
    return {
      ...preResult,
      tPendingTranslation: makeTPendingTranslation(preResult),
      tPendingHtmlTranslation: makeTPendingHtmlTranslation(preResult),
    };
  }, [unwrappedContext]);

  return result;
};

export default useTranslationWrapper;
