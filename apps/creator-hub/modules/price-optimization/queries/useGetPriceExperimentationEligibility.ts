import { useQuery } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { isEligibleQueryKey, rootQueryKey, staleTime } from './constants';

const getPriceExperimentationEligibilityQueryKey = (universeId?: number) =>
  [rootQueryKey, universeId, isEligibleQueryKey] as const;

export function useGetPriceExperimentationEligibility(options?: { enabled?: boolean }) {
  const { gameDetails, isLoadingGame, isErrorLoadingGame } = useCurrentGame();
  const universeId = gameDetails?.id;

  const {
    data,
    isPending: isLoadingEligibilty,
    isLoading: isInitialLoadingEligibilty,
    isError: isErrorEligibility,
  } = useQuery({
    // oxlint-disable typescript/no-non-null-assertion -- guarded by enabled
    queryKey: getPriceExperimentationEligibilityQueryKey(universeId),
    queryFn: () =>
      priceExperimentationApi.getExperimentEligibility({
        universeId: universeId!,
      }),
    enabled: !!universeId && !isLoadingGame && (options?.enabled ?? true),
    staleTime,
  });

  let isEligible = false;
  let transactionVolumeLast30Days = 0;
  let robuxVolumeLast30Days = 0;
  if (!isErrorEligibility && !isLoadingEligibilty) {
    isEligible = data.isEligible;
    transactionVolumeLast30Days = data.transactionVolumeLast30Days;
    robuxVolumeLast30Days = data.robuxVolumeLast30Days;
  }

  const isInitialLoading = isInitialLoadingEligibilty || isLoadingGame;
  const isLoading = isLoadingEligibilty || isInitialLoading;
  const isError = isErrorEligibility || isErrorLoadingGame;

  return {
    isEligible,
    transactionVolumeLast30Days,
    robuxVolumeLast30Days,
    isLoading,
    isInitialLoading, // Keeping v4 interface until later refactor
    isError,
  } as const;
}
