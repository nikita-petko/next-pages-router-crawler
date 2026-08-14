import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetAssetDependenciesResultCreator } from '@rbx/client-asset-permissions-api/v1';
import { CreatorType } from '@rbx/client-asset-permissions-api/v1';
import type { AssetPermissionRequest } from '@modules/clients/assetPermissions';
import groupsClient from '@modules/clients/groups';
import usersClient from '@modules/clients/users';

// NOTE: This is needed to prevent query key clashes since the query key isn't affected by which file it is in.
const KEY_PREFIX = 'assetsPermissionApiHelper_';

const CREATOR_NAME_BATCH_SIZE = 50;

const useFetchDependencyCreatorInfo = (
  creatorKeys: GetAssetDependenciesResultCreator[],
  enabled = true,
): UseQueryResult<Map<GetAssetDependenciesResultCreator, string>> => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [`${KEY_PREFIX}fetchDependencyCreatorInfo`, creatorKeys],
    queryFn: async () => {
      const creatorNamesMap = new Map<GetAssetDependenciesResultCreator, string>();
      const missingCreatorKeys: GetAssetDependenciesResultCreator[] = [];

      // Check cache for existing creator info
      creatorKeys.forEach((creatorKey) => {
        const cachedData = queryClient.getQueryData<string>([
          `${KEY_PREFIX}singleCreatorInfo`,
          creatorKey,
        ]);

        if (cachedData) {
          creatorNamesMap.set(creatorKey, cachedData);
        } else {
          missingCreatorKeys.push(creatorKey);
        }
      });

      // Fetch missing creators in bulk if any
      if (missingCreatorKeys.length > 0) {
        const bulkCreatorNamesMap = new Map<GetAssetDependenciesResultCreator, string>();

        // Deduplicate creators based on both the id and the type
        const uniqueCreators = new Map<string, GetAssetDependenciesResultCreator>(
          missingCreatorKeys.map((key) => [`${key.id}:${key.type}`, key]),
        );

        // Separate users and groups and create reverse lookup maps
        const userIds: number[] = [];
        const groupIds: number[] = [];
        const userIdToKey = new Map<number, GetAssetDependenciesResultCreator>();
        const groupIdToKey = new Map<number, GetAssetDependenciesResultCreator>();

        uniqueCreators.forEach((key) => {
          if (key.id === undefined) {
            return;
          }
          if (key.type === CreatorType.User) {
            userIds.push(key.id);
            userIdToKey.set(key.id, key);
          } else if (key.type === CreatorType.Group) {
            groupIds.push(key.id);
            groupIdToKey.set(key.id, key);
          }
        });

        // Fetch user names in batches
        const fetchUserNames = async () => {
          if (!userIds.length) {
            return;
          }

          const batches = [];
          for (let i = 0; i < userIds.length; i += CREATOR_NAME_BATCH_SIZE) {
            batches.push(userIds.slice(i, i + CREATOR_NAME_BATCH_SIZE));
          }

          const batchPromises = batches.map((batch) => usersClient.getUsersByIds(batch));
          const batchResults = await Promise.all(batchPromises);

          batchResults.forEach((result) => {
            result.data?.forEach((user) => {
              if (user.id !== undefined && user.name) {
                const key = userIdToKey.get(user.id);
                if (key) {
                  bulkCreatorNamesMap.set(key, `@${user.name}`);
                }
              }
            });
          });
        };

        // Fetch group names in batches
        const fetchGroupNames = async () => {
          if (!groupIds.length) {
            return;
          }

          const batches = [];
          for (let i = 0; i < groupIds.length; i += CREATOR_NAME_BATCH_SIZE) {
            batches.push(groupIds.slice(i, i + CREATOR_NAME_BATCH_SIZE));
          }

          const batchPromises = batches.map((batch) => groupsClient.getGroupsInfo(batch));
          const batchResults = await Promise.all(batchPromises);

          batchResults.forEach((result) => {
            result.data?.forEach((group) => {
              if (group.id && group.name) {
                const key = groupIdToKey.get(group.id);
                if (key) {
                  bulkCreatorNamesMap.set(key, group.name);
                }
              }
            });
          });
        };

        // Fetch both user and group names in parallel
        await Promise.all([fetchUserNames(), fetchGroupNames()]);

        // Update individual caches and result map
        bulkCreatorNamesMap.forEach((creatorName, creatorKey) => {
          creatorNamesMap.set(creatorKey, creatorName);
          queryClient.setQueryData([`${KEY_PREFIX}singleCreatorInfo`, creatorKey], creatorName);
        });
      }

      return creatorNamesMap;
    },
    enabled: enabled && creatorKeys.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - creator names don't change often
  });
};

export default useFetchDependencyCreatorInfo;

/**
 * Resolves a display name for each asset permission request's requester, keyed by requestId.
 * As of asset-permissions-api client v1.3.3 the response no longer carries requesterName, so names
 * are resolved here: user requesters → `@username` via the users API, group requesters → group
 * name via the groups API. Falls back to requesterId when a name can't be resolved.
 */
export const useResolveRequesterNames = (
  requests: AssetPermissionRequest[],
  enabled = true,
): UseQueryResult<Map<string, string>> => {
  return useQuery({
    queryKey: [
      `${KEY_PREFIX}resolveRequesterNames`,
      requests.map((r) => `${r.requestId}:${r.requesterCreatorType}:${r.requesterId}`),
    ],
    queryFn: async () => {
      const displayByRequestId = new Map<string, string>();

      // Bucket requester ids by creator type; both users and groups need a name lookup now.
      const userIds = new Set<number>();
      const groupIds = new Set<number>();
      requests.forEach((request) => {
        if (!request.requesterId) {
          return;
        }
        const id = Number(request.requesterId);
        if (Number.isNaN(id)) {
          return;
        }
        if (request.requesterCreatorType === CreatorType.User) {
          userIds.add(id);
        } else if (request.requesterCreatorType === CreatorType.Group) {
          groupIds.add(id);
        }
      });

      const toBatches = (ids: number[]): number[][] => {
        const batches: number[][] = [];
        for (let i = 0; i < ids.length; i += CREATOR_NAME_BATCH_SIZE) {
          batches.push(ids.slice(i, i + CREATOR_NAME_BATCH_SIZE));
        }
        return batches;
      };

      const usernameById = new Map<number, string>();
      const groupNameById = new Map<number, string>();

      const [userResults, groupResults] = await Promise.all([
        Promise.all(toBatches([...userIds]).map((batch) => usersClient.getUsersByIds(batch))),
        Promise.all(toBatches([...groupIds]).map((batch) => groupsClient.getGroupsInfo(batch))),
      ]);

      userResults.forEach((result) => {
        result.data?.forEach((user) => {
          if (user.id !== undefined && user.name) {
            usernameById.set(user.id, `@${user.name}`);
          }
        });
      });
      groupResults.forEach((result) => {
        result.data?.forEach((group) => {
          if (group.id && group.name) {
            groupNameById.set(group.id, group.name);
          }
        });
      });

      requests.forEach((request) => {
        if (request.requestId === undefined) {
          return;
        }
        const fallback = request.requesterId ?? '';
        const id = Number(request.requesterId);
        if (request.requesterCreatorType === CreatorType.Group) {
          displayByRequestId.set(request.requestId, groupNameById.get(id) ?? fallback);
        } else {
          displayByRequestId.set(request.requestId, usernameById.get(id) ?? fallback);
        }
      });

      return displayByRequestId;
    },
    enabled: enabled && requests.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - requester names don't change often
  });
};
