import { useQuery } from '@tanstack/react-query';
import economyClient from '@modules/clients/economy';

export const getGroupBalanceQueryKey = (groupId: number) => ['getGroupBalance', groupId] as const;

const useGetGroupBalanceQuery = (groupId: number) => {
  return useQuery({
    queryKey: getGroupBalanceQueryKey(groupId),
    queryFn: async () => {
      const response = await economyClient.getGroupCurrency(groupId);
      return response.robux ?? null;
    },
    enabled: groupId > 0,
  });
};

export default useGetGroupBalanceQuery;
