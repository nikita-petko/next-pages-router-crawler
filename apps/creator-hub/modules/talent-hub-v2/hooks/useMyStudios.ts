import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { studiosApi } from '../api/talentHubClient';
import type { Studio, StudioPermissions } from '../types';
import { isMocksEnabled, isNoStudiosMockEnabled, isRuntimeMocksQueryEnabled } from '../utils';

function useClientReady(): boolean {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => setIsReady(true), []);
  return isReady;
}

function jsonStudioRowAt(json: unknown, index: number): unknown {
  if (typeof json !== 'object' || json === null || !('studios' in json)) {
    return undefined;
  }
  const { studios } = json;
  if (!Array.isArray(studios)) {
    return undefined;
  }
  return studios[index];
}

function studioPermissionsFromJsonRow(row: unknown): StudioPermissions | undefined {
  if (typeof row !== 'object' || row === null || !('permissions' in row)) {
    return undefined;
  }
  const { permissions } = row;
  if (
    Array.isArray(permissions) &&
    permissions.every((item): item is string => typeof item === 'string')
  ) {
    return permissions;
  }
  return undefined;
}

function studioLocationFromJsonRow(row: unknown): string | null | undefined {
  if (typeof row !== 'object' || row === null || !('location' in row)) {
    return undefined;
  }
  const { location } = row;
  if (location === null) {
    return null;
  }
  if (typeof location === 'string') {
    return location;
  }
  return undefined;
}

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
export function useMyStudios(): UseQueryResult<{ studios: Studio[] }> {
  const isClientReady = useClientReady();
  const router = useRouter();
  const mocks = isMocksEnabled() || isRuntimeMocksQueryEnabled(router.query.mocks);
  const currentGroup = useCurrentGroup();
  const groupId = currentGroup?.id ?? null;

  return useQuery({
    queryKey: ['talent-hub-v2', 'my-studios', { mocks, groupId }],
    queryFn: async () => {
      if (mocks) {
        if (isNoStudiosMockEnabled()) {
          return { studios: [] };
        }
        const { MOCK_STUDIO_V2 } = await import('../mocks/mockData');
        const { group: _unusedGroup, ...studio } = MOCK_STUDIO_V2;
        const studios: Studio[] = [studio];
        return { studios };
      }

      const params = groupId != null ? { groupId } : {};
      const response = await studiosApi.apiStudiosGetRaw(params);
      const { raw } = response;
      const json: unknown = await raw.clone().json();
      const data = await response.value();
      const studios: Studio[] = (data.studios ?? []).map((studioItem, i: number) => {
        const row = jsonStudioRowAt(json, i);
        return {
          ...studioItem,
          permissions: studioPermissionsFromJsonRow(row),
          location: studioLocationFromJsonRow(row),
        };
      });
      return { studios };
    },
    enabled: isClientReady && (mocks || groupId != null),
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      if (mocks) {
        return data;
      }
      if (!currentGroup) {
        return { studios: [] };
      }
      const mine = data.studios.filter((s) => s.groupId != null && s.groupId === currentGroup.id);
      return { studios: mine };
    },
  });
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
