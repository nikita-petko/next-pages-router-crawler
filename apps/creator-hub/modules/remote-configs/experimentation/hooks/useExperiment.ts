import { QueryClient, useQuery } from '@tanstack/react-query';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import { useCallback, useMemo } from 'react';
import { GenericChartState } from '@modules/charts-generic';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';
import { ValidExperiment, ValidGetExperimentResponse } from '../../api/validExperimentationTypes';

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

  return useMemo(() => {
    return {
      experiment: data,
      isDataLoading: isPending,
      isResponseFailed: !!error,
      isUserForbidden: getResponseFromError(error)?.status === StatusCodes.FORBIDDEN,
      error,
    };
  }, [data, error, isPending]);
};

export default useExperiment;
