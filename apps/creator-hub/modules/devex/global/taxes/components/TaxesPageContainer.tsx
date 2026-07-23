import type { FunctionComponent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useGetTaxOnboardingStatus } from '../queries/useGetTaxOnboardingStatus';
import { resolveTaxDocumentationStatusVariant } from '../utils/taxDocumentationStatus';
import { logTaxHubErrorOut } from '../utils/taxTelemetry';
import TaxesErrorState from './TaxesErrorState';
import TaxesLoading from './TaxesLoading';
import TaxesPageContent from './TaxesPage';

const TaxesPageContainer: FunctionComponent = () => {
  const { ready, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { data, isError, isFetching, isLoading, refetch } = useGetTaxOnboardingStatus();
  const hasLoggedLoadError = useRef(false);
  const isRetryingLoadError = isError && isFetching;
  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!isError) {
      hasLoggedLoadError.current = false;
      return;
    }

    if (hasLoggedLoadError.current) {
      return;
    }

    hasLoggedLoadError.current = true;
    logTaxHubErrorOut(unifiedLogger, 'tax_center_load', 'unknown', true);
  }, [isError, ready, unifiedLogger]);

  if (!ready || isLoading || isRetryingLoadError) {
    return <TaxesLoading />;
  }

  if (isError) {
    const loadErrorMessage = tPendingTranslation(
      'Failed to load tax information. Please refresh the page and try again.',
      'Error shown when the DevEx tax center cannot load tax information.',
      translationKey('Taxes.Error.LoadTaxInformation', TranslationNamespace.TaxDocumentation),
    );
    const tryAgainLabel = tPendingTranslation(
      'Try again',
      'Button label for retrying a failed DevEx tax request.',
      translationKey('Taxes.Action.TryAgain', TranslationNamespace.TaxDocumentation),
    );

    return (
      <TaxesErrorState
        message={loadErrorMessage}
        retryLabel={tryAgainLabel}
        onRetry={handleRetry}
      />
    );
  }

  const statusVariant = resolveTaxDocumentationStatusVariant(data?.onboardingStatus);

  return <TaxesPageContent lastUpdatedTime={data?.lastUpdatedTime} statusVariant={statusVariant} />;
};

export default TaxesPageContainer;
