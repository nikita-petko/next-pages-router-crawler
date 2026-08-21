import { useQuery } from '@tanstack/react-query';
import { V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum } from '@rbx/client-groups/v2';
import groupsClient from '@modules/clients/groups';

export const getUsersGroupRolesV2Key = 'groupsClient/getUsersGroupRolesV2';

interface UseGetUsersGroupRolesV2Params {
  userId: number | undefined;
  includeLocked?: boolean;
  includeNotificationPreferences?: boolean;
  discoveryType?: V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum;
}

export const useGetUsersGroupRolesV2 = ({
  userId,
  includeLocked = false,
  includeNotificationPreferences = false,
  discoveryType = V2UsersUserIdGroupsRolesGetDiscoveryTypeEnum.NUMBER_0,
}: UseGetUsersGroupRolesV2Params) => {
  return useQuery({
    queryKey: [
      getUsersGroupRolesV2Key,
      userId,
      includeLocked,
      includeNotificationPreferences,
      discoveryType,
    ],
    queryFn: async () => {
      if (!userId) {
        throw new Error('Invalid userId');
      }
      return groupsClient.getUsersGroupRolesV2(
        userId,
        includeLocked,
        includeNotificationPreferences,
        discoveryType,
      );
    },
    enabled: !!userId,
  });
};

export default useGetUsersGroupRolesV2;
