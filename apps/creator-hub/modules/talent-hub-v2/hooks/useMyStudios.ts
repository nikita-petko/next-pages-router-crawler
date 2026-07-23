import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { studiosApi } from '../api/talentHubClient';
import type { Studio, StudioPermissions } from '../types';
import { isMocksEnabled } from '../utils';

/**
 * Returns studios for the currently-selected Creator Hub group context.
 *
 * Passes `groupId` to the API so the server returns only studios that
 * belong to the active group (server-side ownership filter), avoiding
 * false positives from unrelated studios that happen to share a groupId
 * in the public catalog.
 *
 * When no group is selected (personal context) the query is disabled
 * and returns an empty list — the profile page shows 404 and
 * owner-gated actions (Edit, Close) are hidden.
 */
export function useMyStudios() {
  const mocks = isMocksEnabled();
  const currentGroup = useCurrentGroup();
  const groupId = currentGroup?.id ?? null;

  const query = useQuery<{ studios: Studio[] }>({
    queryKey: ['talent-hub-v2', 'my-studios', { mocks, groupId }],
    queryFn: async () => {
      if (mocks) {
        const { MOCK_STUDIO_V2 } = await import('../mocks/mockData');
        return { studios: [MOCK_STUDIO_V2 as Studio] };
      }

      const params = groupId != null ? { groupId } : {};
      const response = await studiosApi.apiStudiosGetRaw(params);
      const { raw } = response;
      const json = await raw.clone().json();
      const data = await response.value();
      const studios = (data.studios ?? []).map((studio, i: number) => ({
        ...studio,
        permissions: json.studios?.[i]?.permissions as StudioPermissions | undefined,
      })) as Studio[];
      return { studios };
    },
    enabled: mocks || groupId != null,
    staleTime: 5 * 60 * 1000,
  });

  const filtered = useMemo(() => {
    if (!query.data) return undefined;
    if (mocks) return query.data;
    if (!currentGroup) return { studios: [] };
    const mine = query.data.studios.filter(
      (s) => s.groupId != null && s.groupId === currentGroup.id,
    );
    return { studios: mine };
  }, [query.data, mocks, currentGroup]);

  return {
    ...query,
    data: filtered,
  } as UseQueryResult<{ studios: Studio[] }>;
}

/**
 * Returns backend-provided permissions for a studio the current user
 * owns in the active group context.
 *
 * The backend returns permissions as a string array, e.g. `["read", "write"]`.
 * Having `"write"` grants edit-studio and manage-jobs capabilities.
 */
export function useStudioPermissions(studioId: string | undefined) {
  const { data, isLoading } = useMyStudios();
  const studio = studioId ? data?.studios?.find((s) => s.id === studioId) : undefined;
  const hasWrite = studio?.permissions?.includes('write') === true;
  return {
    canEditStudio: hasWrite,
    canManageJobs: hasWrite,
    isLoading,
  };
}

/**
 * True when a group is selected in the left-nav picker — regardless of
 * whether that group has a Talent Hub studio.  Users in any group
 * context cannot apply to jobs; they must switch to their personal
 * account first.
 */
export function useIsInStudioContext() {
  const currentGroup = useCurrentGroup();
  return { isInStudioContext: currentGroup != null, isLoading: false };
}
