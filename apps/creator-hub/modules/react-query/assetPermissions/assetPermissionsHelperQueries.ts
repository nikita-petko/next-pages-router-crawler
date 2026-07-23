import { groupsClient, usersClient } from '@modules/clients';
import { CreatorType, GetAssetDependenciesResultCreator } from '@rbx/clients/assetPermissionsApi';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

// NOTE: This is needed to prevent query key clashes since the query key isn't affected by which file it is in.
const KEY_PREFIX = 'assetsPermissionApiHelper_';

const CREATOR_NAME_BATCH_SIZE = 50;

const useFetchDependencyCreatorInfo = (
  creatorKeys: GetAssetDependenciesResultCreator[],
  enabled: boolean = true,
): UseQueryResult<Map<GetAssetDependenciesResultCreator, string>, Error> => {
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
          if (key.type === CreatorType.User) {
            userIds.push(key.id!);
            userIdToKey.set(key.id!, key);
          } else if (key.type === CreatorType.Group) {
            groupIds.push(key.id!);
            groupIdToKey.set(key.id!, key);
          }
        });

        // Fetch user names in batches
        const fetchUserNames = async () => {
          if (!userIds.length) return;

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
          if (!groupIds.length) return;

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
