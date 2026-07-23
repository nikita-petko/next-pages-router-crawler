import { useQuery } from '@tanstack/react-query';
import organizationApiClient from '@modules/clients/organizationApi';

export interface SuggestedPayoutInfo {
  amount: number;
  createdAt: Date;
}

export interface UseSuggestedPayoutsResult {
  suggestedPayoutsMap: Map<number, SuggestedPayoutInfo>;
  isFetching: boolean;
  isError: boolean;
}

const EMPTY_MAP = new Map<number, SuggestedPayoutInfo>();

export const suggestedPayoutsQueryKey = (organizationId?: string) => [
  'suggestedPayouts',
  organizationId,
];

export const useSuggestedPayouts = (organizationId?: string): UseSuggestedPayoutsResult => {
  const { data, isFetching, isError } = useQuery({
    queryKey: suggestedPayoutsQueryKey(organizationId),
    queryFn: async () => {
      if (!organizationId) {
        return EMPTY_MAP;
      }

      const response =
        await organizationApiClient.groupUniversePayoutClient.getSuggestedPayouts(organizationId);

      const suggestedMap = new Map<number, SuggestedPayoutInfo>();

      response.payouts.forEach((payout) => {
        if (payout.status === 'Success' && payout.oneTimePayout) {
          suggestedMap.set(parseInt(payout.recipientUserId, 10), {
            amount: parseInt(payout.oneTimePayout.amount, 10),
            createdAt: payout.oneTimePayout.createdAt,
          });
        }
      });

      return suggestedMap;
    },
    enabled: !!organizationId,
    staleTime: Infinity, // Cache suggestions until new payout is made
  });

  return {
    suggestedPayoutsMap: data ?? EMPTY_MAP,
    isFetching,
    isError,
  };
};
