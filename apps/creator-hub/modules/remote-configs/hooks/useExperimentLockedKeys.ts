import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { ExperimentState } from '../api/universeExperimentationClientEnums';
import type { ValidConfigEntryDetail } from '../api/validTypes';
import { useCreatorExperimentationClient } from '../CreatorExperimentationClientProvider';
import {
  deriveLockedConditionKeysFromConfigEntries,
  deriveLockedConfigKeysFromExperiments,
} from '../utils/deriveExperimentLockedKeys';

const EXPERIMENT_LOCK_QUERY_KEY_PREFIX = 'experiment-locked-keys';
const ACTIVE_EXPERIMENT_PAGE_SIZE = 1000;

export const getExperimentLockedKeysQueryKey = (universeId: number) => [
  EXPERIMENT_LOCK_QUERY_KEY_PREFIX,
  universeId,
];

const useExperimentLockedKeys = (configEntries: ValidConfigEntryDetail[]) => {
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const client = useCreatorExperimentationClient();

  const { data } = useQuery({
    queryKey: getExperimentLockedKeysQueryKey(universeId),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentsGet({
        universeId,
        paramsSkip: 0,
        paramsMaxPageSize: ACTIVE_EXPERIMENT_PAGE_SIZE,
        paramsStateFilters: [ExperimentState.Scheduled, ExperimentState.Running],
      }),
    enabled: !isUniverseLoading,
  });

  const lockedConfigKeys = useMemo(
    () => deriveLockedConfigKeysFromExperiments(data?.experimentsSummary ?? []),
    [data?.experimentsSummary],
  );

  const lockedConditionKeys = useMemo(
    () => deriveLockedConditionKeysFromConfigEntries(lockedConfigKeys, configEntries),
    [configEntries, lockedConfigKeys],
  );

  return { lockedConfigKeys, lockedConditionKeys };
};

export default useExperimentLockedKeys;
