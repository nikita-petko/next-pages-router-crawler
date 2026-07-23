/* istanbul ignore file */
import paymentsBonusServiceClient, {
  GamePassProductType,
  type GetBonusOptInInfoResponse,
} from '@modules/clients/bonusItem';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { gamePassKeys } from '@modules/passes/queries/constants';
import { DEFAULT_STALE_TIME, DEFAULT_RETRIES } from './constants';

type UseGetGamePassBonusOptInParams = {
  universeId?: number;
  gamePassId?: number;
};

type Options = Omit<
  UseQueryOptions<GetBonusOptInInfoResponse, Error, GetBonusOptInInfoResponse>,
  'queryKey' | 'queryFn'
>;

/**
 * Fetches bonus opt-in status for a product (e.g. game pass).
 * Uses GamePassProductType by default when productType is omitted.
 */
export function useGetGamePassBonusOptIn(
  { universeId, gamePassId }: UseGetGamePassBonusOptInParams,
  options: Options = {},
) {
  return useQuery({
    queryKey: gamePassKeys.bonusOptIn(universeId!, gamePassId!),
    queryFn: () =>
      paymentsBonusServiceClient.getOptInStatus({
        productTargetId: gamePassId,
        productType: GamePassProductType,
      }),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
    enabled: (options.enabled ?? true) && !!universeId && !!gamePassId,
  });
}

export default useGetGamePassBonusOptIn;
