import { useQuery } from '@tanstack/react-query';
import contentQualityClient from '@modules/clients/contentQuality';
import { uninitializedUniverseId } from '@modules/miscellaneous/common';

export const getUniverseQualityStatusQueryKey = (universeId: number) =>
  ['contentQualityApi', 'getUniverseQualityStatus', universeId] as const;

export function useGetUniverseQualityStatus(universeId: number) {
  return useQuery({
    queryKey: getUniverseQualityStatusQueryKey(universeId),
    queryFn: () => contentQualityClient.getUniverseQualityStatus(universeId),
    enabled: universeId !== uninitializedUniverseId && universeId > 0,
  });
}
