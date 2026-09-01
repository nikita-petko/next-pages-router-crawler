import { useQuery } from '@tanstack/react-query';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import type { ValidPreviewRolloutResponse } from '../../api/validExperimentationTypes';
import { useCreatorExperimentationClient } from '../../CreatorExperimentationClientProvider';

export const getPreviewRolloutQueryKey = (
  experimentId: string,
  variantId: string,
  universeId: number,
) => ['preview-rollout', experimentId, variantId, universeId];

const usePreviewRollout = ({
  experimentId,
  variantId,
  enabled = true,
}: {
  experimentId: string;
  variantId: string;
  enabled?: boolean;
}): {
  data: ValidPreviewRolloutResponse | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
} => {
  const client = useCreatorExperimentationClient();
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: getPreviewRolloutQueryKey(experimentId, variantId, universeId),
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentExperimentIdRolloutpreviewPost({
        universeId,
        experimentId,
        variantId,
      }),
    enabled: enabled && !!variantId && !isUniverseLoading,
  });

  return { data, isLoading, error, refetch };
};

export default usePreviewRollout;
