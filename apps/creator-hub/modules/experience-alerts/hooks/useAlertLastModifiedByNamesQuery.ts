import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import usersClient, { type MultiGetUserResponse } from '@modules/clients/users';
import type { AnalyticsAlertDetail } from '../constants/types';

const QUERY_KEY_PREFIX = 'alert-last-modified-by-names';

/**
 * Batch-resolves the `lastModifiedBy` userId strings on a list of alerts to
 * Roblox display names, using the same `getUsersByIds` pattern as the
 * remote-configs history page. Returns a `Map<userId, displayName>` that
 * callers can index by `alert.lastModifiedBy`.
 */
const useAlertLastModifiedByNamesQuery = (alerts: AnalyticsAlertDetail[]): Map<string, string> => {
  const userIds = useMemo(() => {
    const ids = new Set<number>();
    for (const alert of alerts) {
      if (alert.lastModifiedBy) {
        const parsed = Number(alert.lastModifiedBy);
        if (Number.isFinite(parsed) && parsed > 0) {
          ids.add(parsed);
        }
      }
    }
    return Array.from(ids);
  }, [alerts]);

  const { data: response } = useQuery({
    queryKey: [QUERY_KEY_PREFIX, ...userIds],
    queryFn: () => usersClient.getUsersByIds(userIds),
    enabled: userIds.length > 0,
  });

  return useMemo(() => {
    const map = new Map<string, string>();
    const users: MultiGetUserResponse[] = response?.data ?? [];
    for (const { id, displayName, name } of users) {
      if (id != null) {
        map.set(String(id), displayName ?? name ?? String(id));
      }
    }
    return map;
  }, [response]);
};

export default useAlertLastModifiedByNamesQuery;
