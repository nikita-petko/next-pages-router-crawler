import { useFlag } from '@rbx/flags';
import { isTaxDocumentationEnabled } from '@generated/flags/devex';
import { useGetTaxDevexStatus } from '../../queries/useGetTaxDevexStatus';

export function useTaxDocumentationAccess() {
  const { ready: isFlagReady, value: isFlagEnabled } = useFlag(isTaxDocumentationEnabled);
  const shouldFetchTaxDevexStatus =
    isFlagReady && isFlagEnabled && process.env.buildTarget === 'global';
  const { data: taxDevexStatus, isLoading: isTaxDevexStatusLoading } = useGetTaxDevexStatus({
    enabled: shouldFetchTaxDevexStatus,
  });

  return {
    canAccessTaxDocumentation: shouldFetchTaxDevexStatus && taxDevexStatus?.hasDevexed === true,
    isLoading: !isFlagReady || (shouldFetchTaxDevexStatus && isTaxDevexStatusLoading),
  };
}
