import { useQuery } from '@tanstack/react-query';

import { getCanSpendGroupFunds } from '@services/groups/groupPermissionsService';

const STALE_TIME_MS = 5 * 60 * 1000;

interface GroupSpendPermissionResult {
  /**
   * Fails closed: a lookup failure is treated as a denial so we never offer a
   * group funding source the server would reject at spend time.
   */
  isGroupSpendPermissionDenied: boolean;
  isLoading: boolean;
}

const useGroupSpendPermission = (groupId?: number): GroupSpendPermissionResult => {
  const query = useQuery<boolean>({
    enabled: groupId !== undefined,
    queryFn: ({ signal }) => getCanSpendGroupFunds(groupId as number, signal),
    queryKey: ['groupSpendPermission', groupId ?? null],
    retry: 1,
    staleTime: STALE_TIME_MS,
  });

  return {
    isGroupSpendPermissionDenied: groupId !== undefined && (query.data === false || query.isError),
    isLoading: query.isLoading,
  };
};

export default useGroupSpendPermission;
