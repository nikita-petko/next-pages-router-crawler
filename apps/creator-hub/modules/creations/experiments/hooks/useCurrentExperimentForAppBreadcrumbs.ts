import { useRouter } from 'next/router';
import { client } from '@modules/clients/analytics/universeExperimentation';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

/**
 * This hook is to be used exclusively for app bread crumbs and navigation
 * Please use 'useExperiment' directly if it's available
 */
const useCurrentExperimentForAppBreadcrumbs = () => {
  const { gameDetails, isLoadingGame } = useCurrentGame();
  const router = useRouter();
  const { experimentId } = router.query;

  const { data } = useQuery({
    queryKey: ['experiment', gameDetails?.id, experimentId],
    queryFn: () =>
      client.v1UniversesUniverseIdExperimentExperimentIdGet({
        universeId: gameDetails!.id!,
        experimentId: experimentId as string,
      }),
    enabled: !isLoadingGame && !!gameDetails?.id && !!experimentId,
  });

  return useMemo(
    () => ({
      experiment: {
        id: data?.experiment?.id,
        name: data?.experiment?.name,
      },
    }),
    [data],
  );
};

export default useCurrentExperimentForAppBreadcrumbs;
