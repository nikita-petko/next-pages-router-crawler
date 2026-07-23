import { skipToken, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { studiosApi } from '../api/talentHubClient';
import type { Studio, ListStudiosResponse, StudiosListStudiosRequest } from '../types';
import { isMocksEnabled, isRuntimeMocksQueryEnabled } from '../utils';

const QUERY_KEYS = {
  studios: {
    list: (params?: StudiosListStudiosRequest, mocks?: boolean) =>
      ['talent-hub-v2', 'studios', params, { mocks }] as const,
    detail: (id: string, mocks?: boolean) =>
      ['talent-hub-v2', 'studios', 'detail', id, { mocks }] as const,
  },
};

function useClientReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => setIsReady(true), []);
  return isReady;
}

/**
 * The generated StudioFromJSON strips unknown fields (including
 * `permissions` and the TH2 `location` rollout field). Use the raw
 * method and merge those fields from the original JSON.
 */
async function fetchStudioWithPermissions(id: string): Promise<Studio> {
  const response = await studiosApi.apiStudiosIdGetRaw({ id });
  const { raw } = response;
  const json = await raw.clone().json();
  const studio = await response.value();
  return { ...studio, permissions: json.permissions, location: json.location } as Studio;
}

async function fetchStudiosWithPermissions(
  params: StudiosListStudiosRequest,
): Promise<ListStudiosResponse> {
  const response = await studiosApi.apiStudiosGetRaw(params);
  const { raw } = response;
  const json = await raw.clone().json();
  const data = await response.value();
  const studios = (data.studios ?? []).map((studio, i) => ({
    ...studio,
    permissions: json.studios?.[i]?.permissions,
    location: json.studios?.[i]?.location,
  })) as Studio[];
  return { ...data, studios } as ListStudiosResponse;
}

export function useStudios(params: StudiosListStudiosRequest = {}) {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  return useQuery<ListStudiosResponse>({
    queryKey: QUERY_KEYS.studios.list(params, mocks),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_STUDIOS_RESPONSE_V2 } = await import('../mocks/mockData');
        return MOCK_STUDIOS_RESPONSE_V2 as ListStudiosResponse;
      }
      return fetchStudiosWithPermissions(params);
    },
    enabled: isClientReady,
  }) as UseQueryResult<ListStudiosResponse>;
}

export function useStudio(studioId: string | undefined) {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  return useQuery<Studio>({
    queryKey: studioId
      ? QUERY_KEYS.studios.detail(studioId, mocks)
      : ['talent-hub-v2', 'studios', 'detail', 'none'],
    queryFn:
      studioId || mocks
        ? async () => {
            if (mocks) {
              const { MOCK_STUDIOS_V2 } = await import('../mocks/mockData');
              const match = MOCK_STUDIOS_V2.find((s) => s.id === studioId);
              if (match) {
                return match as Studio;
              }
              return MOCK_STUDIOS_V2[0] as Studio;
            }
            if (!studioId) {
              throw new Error('Missing required studio id');
            }
            return fetchStudioWithPermissions(studioId);
          }
        : skipToken,
    enabled: isClientReady,
  }) as UseQueryResult<Studio>;
}
