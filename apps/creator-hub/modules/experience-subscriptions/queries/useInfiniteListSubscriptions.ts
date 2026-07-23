import { ProductStatusType } from '@rbx/clients/developerSubscriptionsApi';
import {
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useExperienceSubscriptionsClientProvider } from '../context/ExperienceSubscriptionsClientProvider';
import {
  DEFAULT_RETRIES,
  DEFAULT_PAGE_LIMIT,
  subscriptionKeys,
  DEFAULT_STALE_TIME,
} from './constants';
import type { SubscriptionCreatorDetails } from '../types/SubscriptionCreatorDetails';

type UseListSubscriptionsParams = {
  universeId: number;
  limit?: number;
};

export type ListSubscriptionsCreatorDetailsResponse = {
  subscriptions: Readonly<SubscriptionCreatorDetails>[];
  nextPageCursor?: string;
  hasMoreResults?: boolean;
};

export type InfiniteListSubscriptionsData = InfiniteData<
  ListSubscriptionsCreatorDetailsResponse,
  string
>;

export type UseInfiniteListSubscriptionsOptions<TData = InfiniteListSubscriptionsData> = Omit<
  UseInfiniteQueryOptions<ListSubscriptionsCreatorDetailsResponse, Error, TData, QueryKey, string>,
  'queryKey' | 'queryFn' | 'getNextPageParam' | 'getPreviousPageParam' | 'initialPageParam'
>;

export type UseInfiniteListSubscriptionsResult<TData = InfiniteListSubscriptionsData> =
  UseInfiniteQueryResult<TData, Error>;

export function useInfiniteListSubscriptions<TData = InfiniteListSubscriptionsData>(
  { universeId, limit = DEFAULT_PAGE_LIMIT }: UseListSubscriptionsParams,
  options: UseInfiniteListSubscriptionsOptions<TData> = {},
): UseInfiniteListSubscriptionsResult<TData> {
  const { experienceSubscriptionsClient } = useExperienceSubscriptionsClientProvider();

  return useInfiniteQuery({
    queryKey: subscriptionKeys.list(universeId, { limit }),
    queryFn: async ({ pageParam: cursor }) => {
      const { developerSubscriptions, nextCursor, hasMoreResults } =
        await experienceSubscriptionsClient.getExperienceSubscriptions(
          universeId,
          cursor || undefined,
          limit,
        );

      // Get USD prices to use for display
      const { priceTierPrices } = await experienceSubscriptionsClient.getPriceInfo(universeId);
      const subscriptionPriceMap = priceTierPrices ?? {};

      const subscriptions =
        developerSubscriptions?.map((developerSubscription) => {
          const subscription: SubscriptionCreatorDetails = {
            id: developerSubscription.id ?? '',
            name: developerSubscription.name ?? '',
            productStatusType:
              developerSubscription.productStatusType ?? ProductStatusType.Inactive,
            basePriceId: developerSubscription.basePriceId ?? null,
            imageAssetId: developerSubscription.imageAssetId ?? null,
            universeId: developerSubscription.universeId ?? universeId,
            createdTimestampMs: developerSubscription.createdTimestampMs ?? null,
            price: subscriptionPriceMap[developerSubscription.basePriceId ?? ''] ?? null,
            priceInRobux: developerSubscription.priceInRobux ?? null,
            currencyType: developerSubscription.currencyType ?? null,
            isRegionalPricingEnabled: developerSubscription.isRegionalPricingEnabled ?? null,
          };
          return subscription;
        }) || [];

      return {
        subscriptions,
        nextPageCursor: hasMoreResults ? (nextCursor ?? undefined) : undefined,
        hasMoreResults,
      } satisfies ListSubscriptionsCreatorDetailsResponse;
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage?.nextPageCursor,
    retry: DEFAULT_RETRIES,
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}
