import experienceStoreClient from '@modules/clients/experienceStore';
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { ExperienceStoreStateResponse } from '@modules/clients/experienceStore';
import { DEFAULT_RETRIES, experienceStoreKeys } from './constants';

type Options<TData = ExperienceStoreStateResponse> = Omit<
  UseQueryOptions<ExperienceStoreStateResponse, Error, TData>,
  'queryKey' | 'queryFn'
>;

const STALE_TIME_MS = 60 * 60 * 1000; // 1 hour - we don't expect this to change frequently

export function useGetExperienceStoreState<TData = ExperienceStoreStateResponse>(
  universeId: number | undefined,
  options: Options<TData> = {},
) {
  return useQuery({
    queryKey: experienceStoreKeys.experienceStoreState(universeId!),
    queryFn: () => experienceStoreClient.getUniverseReleaseState(universeId!),
    retry: DEFAULT_RETRIES,
    staleTime: STALE_TIME_MS,
    ...options,
    enabled: (options.enabled ?? true) && !!universeId,
  });
}

export default useGetExperienceStoreState;
