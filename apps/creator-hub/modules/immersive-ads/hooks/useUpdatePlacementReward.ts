import { useCallback, useState } from 'react';
import developerAdsStatsClient from '@modules/clients/developerAdsStats';
import type { PlacementRewardStatus, RewardAccessMode } from '../types/rewardTypes';

export interface UpdatePlacementRewardParams {
  placementId: number;
  productId: number;
  universeId: number;
  status?: PlacementRewardStatus;
  accessMode?: RewardAccessMode;
}

export function useUpdatePlacementReward() {
  const [isLoading, setIsLoading] = useState(false);

  const mutate = useCallback(async (params: UpdatePlacementRewardParams) => {
    setIsLoading(true);
    try {
      await developerAdsStatsClient.updatePlacementReward({
        adPlacementId: params.placementId,
        productId: params.productId,
        updatePlacementRewardRequest: {
          universeId: params.universeId,
          status: params.status,
          accessMode: params.accessMode,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading };
}
