import { useQuery } from '@tanstack/react-query';
import { CreatorHomeClient } from '@modules/clients/creatorHome';

const signalsQueryKey = ['creatorHome', 'signals'] as const;

function useGetSignals(enabled = false) {
  return useQuery({
    queryKey: signalsQueryKey,
    enabled,
    queryFn: () => CreatorHomeClient.signalsApi.signalsGetSignals(),
  });
}

export default useGetSignals;
