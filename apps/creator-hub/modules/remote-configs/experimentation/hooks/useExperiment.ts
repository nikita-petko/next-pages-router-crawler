import { useCallback, useMemo } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { StatusCodes } from '@rbx/core';
import { useFlag } from '@rbx/flags';
import { isEhdResultsAlwaysFetched as isEhdResultsAlwaysFetchedFlag } from '@generated/flags/creatorAnalytics';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import { getResponseFromError } from '@modules/clients/utils';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type {
  ValidExperiment,
  ValidGetExperimentResponse,
} from '../../api/validExperimentationTypes';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';

export const getExperimentQueryKey = (experimentId: string, universeId: number) => [
  'get-creator-experimentation',
  experimentId,
  universeId,
];

export const refreshExperimentQuery = async (
  queryClient: QueryClient,
  experimentId: string,
  universeId: number,
) => {
  return queryClient.invalidateQueries({
    queryKey: getExperimentQueryKey(experimentId, universeId),
    exact: true,
  });
};

export const experimentIdPlaceholder = '__placeholder__';

const useExperiment = ({
  experimentId,
  refetchOnMount = false,
}: {
  experimentId: string;
  refetchOnMount?: boolean;
}): {
  experiment?: ValidExperiment;
} & GenericChartState => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  const select = useCallback((data: ValidGetExperimentResponse) => {
    return data.experiment;
  }, []);

  const { data, isPending, error } = useQuery({
    queryKey: getExperimentQueryKey(experimentId, universeId),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentExperimentIdGet({
        universeId,
        experimentId,
      }),
    select,
    enabled: !isUniverseLoading && experimentId !== experimentIdPlaceholder,
    refetchOnMount,
  });

  const { ready: isEhdResultsAlwaysFetchedFlagReady, value: isEhdResultsAlwaysFetchedFlagValue } =
    useFlag(isEhdResultsAlwaysFetchedFlag);
  const shouldForceEarlyHarmAnalysisPeriod =
    isEhdResultsAlwaysFetchedFlagReady && isEhdResultsAlwaysFetchedFlagValue;

  return useMemo(() => {
    const experiment =
      data && shouldForceEarlyHarmAnalysisPeriod
        ? { ...data, isEarlyHarmAnalysisPeriod: true }
        : data;

    return {
      experiment,
      isDataLoading: isPending,
      isResponseFailed: !!error,
      isUserForbidden: getResponseFromError(error)?.status === StatusCodes.FORBIDDEN,
      error,
    };
  }, [data, error, isPending, shouldForceEarlyHarmAnalysisPeriod]);
};

export default useExperiment;
