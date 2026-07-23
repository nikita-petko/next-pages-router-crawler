/* istanbul ignore file */
import passesClient from '@modules/clients/passes';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { DEFAULT_RETRIES, DEFAULT_STALE_TIME, gamePassKeys } from './constants';

type PassMetadataResponse = Awaited<ReturnType<typeof passesClient.getPassMetadata>>;

type Options<TData = PassMetadataResponse> = Omit<
  UseQueryOptions<PassMetadataResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

/**
 * Fetches game pass metadata (e.g. default icon asset id) via passesClient.getPassMetadata().
 */
// eslint-disable-next-line import/prefer-default-export -- keep named export
export function useGetPassMetadata(options: Options = {}) {
  return useQuery({
    queryKey: gamePassKeys.metadata(),
    queryFn: ({ signal }) => passesClient.getPassMetadata({ signal }),
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRIES,
    ...options,
  });
}
