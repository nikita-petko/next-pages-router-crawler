/* istanbul ignore file */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import passesClient, { type GamePassConfigV2 } from '@modules/clients/passes';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, gamePassKeys } from './constants';

type Params = {
  universeId?: number;
  gamePassId?: number;
};

type Options = Omit<
  UseQueryOptions<GamePassConfigV2, Error, GamePassConfigV2>,
  'queryKey' | 'queryFn'
>;

/**
 * Fetches a single game pass configuration by universe and game pass id.
 */
export function useGetGamePassConfig({ universeId, gamePassId }: Params, options: Options = {}) {
  return useQuery({
    // oxlint-disable typescript/no-non-null-assertion -- guarded by enabled
    queryKey: gamePassKeys.config(universeId!, gamePassId!),
    queryFn: ({ signal }) =>
      passesClient.getGamePassConfig(
        { universeId: universeId!, gamePassId: gamePassId! },
        { signal },
      ),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
    enabled: (options.enabled ?? true) && !!universeId && universeId > 0 && !!gamePassId,
  });
}
