import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { studiosApi } from '../api/talentHubClient';
import type { Studio, ListStudiosResponse, StudiosListStudiosRequest } from '../types';
import { isMocksEnabled } from '../utils';

const QUERY_KEYS = {
  studios: {
    list: (params?: StudiosListStudiosRequest, mocks?: boolean) =>
      ['talent-hub-v2', 'studios', params, { mocks }] as const,
    detail: (id: string, mocks?: boolean) =>
      ['talent-hub-v2', 'studios', 'detail', id, { mocks }] as const,
  },
};

/**
 * The generated StudioFromJSON strips unknown fields (including
 * `permissions`).  Use the raw method and merge the permissions
 * from the original JSON so UI can gate on backend-provided perms.
 */
async function fetchStudioWithPermissions(id: string): Promise<Studio> {
  const response = await studiosApi.apiStudiosIdGetRaw({ id });
  const { raw } = response;
  const json = await raw.clone().json();
  const studio = await response.value();
  return { ...studio, permissions: json.permissions } as Studio;
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
  })) as Studio[];
  return { ...data, studios } as ListStudiosResponse;
}

export function useStudios(params: StudiosListStudiosRequest = {}) {
  const mocks = isMocksEnabled();
  return useQuery<ListStudiosResponse>({
    queryKey: QUERY_KEYS.studios.list(params, mocks),
    queryFn: async () => {
      if (mocks) {
        const { MOCK_STUDIOS_RESPONSE_V2 } = await import('../mocks/mockData');
        return MOCK_STUDIOS_RESPONSE_V2 as ListStudiosResponse;
      }
      return fetchStudiosWithPermissions(params);
    },
  }) as UseQueryResult<ListStudiosResponse>;
}

export function useStudio(studioId: string | undefined) {
  const mocks = isMocksEnabled();
  return useQuery<Studio>({
    queryKey: studioId
      ? QUERY_KEYS.studios.detail(studioId, mocks)
      : ['talent-hub-v2', 'studios', 'detail', 'none'],
    queryFn: async () => {
      if (!studioId) {
        throw new Error('Studio ID is required.');
      }
      if (mocks) {
        const { MOCK_STUDIOS_V2 } = await import('../mocks/mockData');
        const match = MOCK_STUDIOS_V2.find((s) => s.id === studioId);
        if (match) return match as Studio;
        return MOCK_STUDIOS_V2[0] as Studio;
      }
      return fetchStudioWithPermissions(studioId);
    },
    enabled: Boolean(studioId),
  }) as UseQueryResult<Studio>;
}
