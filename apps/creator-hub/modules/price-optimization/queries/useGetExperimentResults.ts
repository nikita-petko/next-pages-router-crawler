import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { MICRO_MULTIPLE } from '../constants/metricsMetadata';
import { isInitialExperimentComplete } from '../helpers/experimentUtils';
import { getExperimentResultsQueryKey, queryRetry, rootQueryKey } from './constants';
import { useGetLatestExperiment } from './useGetLatestExperiment';

function convertMicroToActual(microValue: number): number;
function convertMicroToActual(microValue: null): null;
function convertMicroToActual(microValue: number | null): number | null;
function convertMicroToActual(microValue: number | null): number | null {
  return microValue ? microValue / MICRO_MULTIPLE : null;
}

// Similar fields as in GetExperimentResultsResponse
// except with all the micro fields converted to their actual values
export type ExperimentResult = {
  shouldChangePrices: boolean;
  recommendedPriceChange: number | null;
  projectedRevenueLift: number | null;
  testPopulation: number;
};

export function useGetExperimentResults() {
  const {
    universeId,
    latestExperiment: currentExperiment,
    isLoading: isCurrentExperimentLoading,
    isError: isCurrentExperimentError,
  } = useGetLatestExperiment();

  const experimentHasResults = isInitialExperimentComplete(currentExperiment?.state);
  const dependenciesLoaded = !isCurrentExperimentLoading && !isCurrentExperimentError;

  const queryKey = useMemo(
    () => [rootQueryKey, universeId, getExperimentResultsQueryKey, currentExperiment?.id],
    [universeId, currentExperiment?.id],
  );

  const { data, isPending, isError } = useQuery({
    queryKey,
    // oxlint-disable typescript/no-non-null-assertion -- guarded by enabled
    queryFn: () =>
      priceExperimentationApi.getExperimentResults({
        universeId: universeId!,
        experimentId: currentExperiment!.id,
      }),
    enabled: dependenciesLoaded && experimentHasResults,
    staleTime: Infinity,
    retry: queryRetry,
  });

  const experimentResults: ExperimentResult | undefined = data
    ? {
        shouldChangePrices: data.shouldChangePrices,
        recommendedPriceChange: convertMicroToActual(data.recommendedPriceChange),
        projectedRevenueLift: convertMicroToActual(data.projectedRevenueLift),
        testPopulation: convertMicroToActual(data.testPopulation),
      }
    : undefined;

  return {
    experimentResultsRaw: data,
    experimentResults,
    isLoading: isPending || !dependenciesLoaded,
    isError,
  };
}
