import { useQuery } from '@tanstack/react-query';
import { getGameDetails } from './gameRequest';

export function useGetGameDetails(universeIds: number[]) {
  return useQuery({
    queryKey: ['games', universeIds],
    queryFn: () => {
      return getGameDetails(universeIds);
    },
  });
}

export default useGetGameDetails;
