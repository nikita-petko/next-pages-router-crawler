import { useMemo } from 'react';
import { TUseTranslationResult, TWrappedUseTranslationResult } from './types';
import { translateHTMLFn, translationFn } from './wrapperFunctions';
import makeTPendingTranslation from './tPendingTranslation';

const useTranslationWrapper = (given: TUseTranslationResult): TWrappedUseTranslationResult => {
  const { ready, translate, translateHTML } = given;

  /**
   * We re-memoize here to workaround if the object passed changes when the actual functions don't.
   * (This also simplifies the subsequent implementation of namespace switching.)
   */
  const unwrappedContext = useMemo(() => {
    return { ready, translate, translateHTML };
  }, [ready, translate, translateHTML]);

  const result = useMemo((): TWrappedUseTranslationResult => {
    const preResult: Omit<TWrappedUseTranslationResult, 'tPendingTranslation'> = {
      ready: unwrappedContext.ready,
      translate: translationFn(unwrappedContext),
      translateHTML: translateHTMLFn(unwrappedContext),
    };
    return {
      ...preResult,
      tPendingTranslation: makeTPendingTranslation(preResult),
    };
  }, [unwrappedContext]);

  return result;
};

export default useTranslationWrapper;
