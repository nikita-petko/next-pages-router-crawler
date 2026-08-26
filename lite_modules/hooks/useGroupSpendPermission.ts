import { useQuery } from '@tanstack/react-query';

import { getCanSpendGroupFunds } from '@services/groups/groupPermissionsService';
import { getCanConfigureRevenueDetails } from '@services/organizations/organizationPermissionsService';

const STALE_TIME_MS = 5 * 60 * 1000;

interface GroupSpendPermissionResult {
  /**
   * Fails closed when neither permission system confirms access, matching the
   * conversion backend's compatibility check during groups/orgs unification.
   */
  isGroupSpendPermissionDenied: boolean;
  isLoading: boolean;
}

const getResolvedCanSpendGroupFunds = async (
  groupId: number,
  abortSignal?: AbortSignal,
): Promise<boolean> => {
  const permissionLookups = [
    getCanSpendGroupFunds(groupId, abortSignal),
    getCanConfigureRevenueDetails(groupId, abortSignal),
  ];

  return new Promise((resolve, reject) => {
    let firstError: unknown;
    let settledCount = 0;

    const handleSettled = () => {
      settledCount += 1;
      if (settledCount === permissionLookups.length) {
        if (firstError !== undefined) {
          reject(firstError);
        } else {
          resolve(false);
        }
      }
    };

    permissionLookups.forEach((lookup) => {
      lookup.then(
        (isAllowed) => {
          if (isAllowed) {
            resolve(true);
          }
          handleSettled();
        },
        (error: unknown) => {
          firstError ??= error;
          handleSettled();
        },
      );
    });
  });
};

const useGroupSpendPermission = (groupId?: number): GroupSpendPermissionResult => {
  const query = useQuery<boolean>({
    enabled: groupId !== undefined,
    queryFn: ({ signal }) => getResolvedCanSpendGroupFunds(groupId as number, signal),
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
