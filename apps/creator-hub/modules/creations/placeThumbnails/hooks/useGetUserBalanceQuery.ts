import { economyClient } from '@modules/clients';
import { useQuery } from '@tanstack/react-query';

export const getUserBalanceQueryKey = (userId: number) => ['getUserBalance', userId] as const;

const useGetUserBalanceQuery = (userId: number) => {
  return useQuery({
    queryKey: getUserBalanceQueryKey(userId),
    queryFn: async () => {
      const response = await economyClient.getUserCurrency(userId);
      return response.robux ?? null;
    },
  });
};

export default useGetUserBalanceQuery;
