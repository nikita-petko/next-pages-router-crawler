import { useQuery } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';

const useVisitCount = (accountId: string, matchId: string) => {
  const response = useQuery({
    queryKey: ['visit-count', accountId, matchId],
    queryFn: async () => {
      return rightsClient.getMatchVisitCount(accountId, matchId);
    },
    enabled: !!accountId && !!matchId,
  });
  return {
    visitCount: response.data?.visitCount ?? 0,
    ...response,
  };
};

export default useVisitCount;
