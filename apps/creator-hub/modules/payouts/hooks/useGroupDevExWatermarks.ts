import { useQuery } from '@tanstack/react-query';
import economyClient from '@modules/clients/economy';
import type { NormalizedEstimatedFiat } from '@modules/devex/global/cashOut/utils/devexWatermarkUtil';
import { normalizeGroupWatermarks } from '../utils/groupWatermarkUtils';

export const groupWatermarksQueryKey = (groupId?: string) => ['groupDevExWatermarks', groupId];

export interface UseGroupDevExWatermarksResult {
  normalizedWatermarks: NormalizedEstimatedFiat | undefined;
  isLoading: boolean;
  isError: boolean;
}

export const useGroupDevExWatermarks = (groupId?: string): UseGroupDevExWatermarksResult => {
  const { data, isLoading, isError } = useQuery({
    queryKey: groupWatermarksQueryKey(groupId),
    queryFn: async () => {
      const response = await economyClient.getGroupDevExWatermarks(Number(groupId));
      return normalizeGroupWatermarks(response);
    },
    enabled: !!groupId,
  });

  return {
    normalizedWatermarks: data,
    isLoading,
    isError,
  };
};

export default useGroupDevExWatermarks;
