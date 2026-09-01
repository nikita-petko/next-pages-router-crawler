// Builds the alert banner rendered in a terms-step footer when a revenue-share mutation fails.
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareBanner from '../components/RevShareBanner';
import type {
  ClassifiedRevShareMutationError,
  RevShareMutationOperation,
} from '../utils/revShareMutationError';
import { translateRevShareMutationError } from '../utils/revShareMutationErrorPresentation';

/** Async handlers are accepted so callers can pass their refetch callback without a wrapper. */
export type RevShareRefreshStaleErrorHandler = () => void | Promise<void>;

type RevShareMutationErrorBannerOptions = {
  operation: RevShareMutationOperation;
  mutationError?: ClassifiedRevShareMutationError | null;
  /** Supplied only when the owning flow can refetch; stale errors then offer a Refresh action. */
  onRefreshStaleError?: RevShareRefreshStaleErrorHandler;
};

const useRevShareMutationErrorBanner = ({
  operation,
  mutationError = null,
  onRefreshStaleError,
}: RevShareMutationErrorBannerOptions): ReactNode | undefined => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const bannerRef = useRef<HTMLDivElement>(null);
  const refreshLabel = tPendingTranslation(
    'Refresh',
    'Button label to refresh revenue-share data after a stale mutation error.',
    translationKey('Action.Refresh', TranslationNamespace.Controls),
  );
  const hasError = mutationError != null;
  useEffect(() => {
    if (hasError) {
      bannerRef.current?.focus();
    }
  }, [hasError, mutationError?.kind, mutationError?.result]);

  return useMemo(() => {
    if (mutationError == null) {
      return undefined;
    }
    const presentation = translateRevShareMutationError(
      operation,
      mutationError,
      tPendingTranslation,
    );
    if (presentation.kind === 'stale' && onRefreshStaleError !== undefined) {
      return (
        <RevShareBanner
          ref={bannerRef}
          tabIndex={-1}
          tone='alert'
          message={presentation.message}
          actionLabel={refreshLabel}
          onAction={() => {
            void onRefreshStaleError();
          }}
        />
      );
    }
    return (
      <RevShareBanner ref={bannerRef} tabIndex={-1} tone='alert' message={presentation.message} />
    );
  }, [mutationError, onRefreshStaleError, operation, refreshLabel, tPendingTranslation]);
};

export default useRevShareMutationErrorBanner;
