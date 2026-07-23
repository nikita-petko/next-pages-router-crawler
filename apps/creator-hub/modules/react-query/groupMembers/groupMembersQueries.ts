import { useQuery } from '@tanstack/react-query';
import groupsClient from '@modules/clients/groups';

const ORGANIZATIONS_GROUPS_KEY_PREFIX = 'organizationsApi_groups_';

export type TGroupInfo = {
  ownerId?: number;
  groupName?: string;
};

export const useGetGroupInfo = (groupId?: string) => {
  return useQuery({
    enabled: !!groupId,
    queryKey: [`${ORGANIZATIONS_GROUPS_KEY_PREFIX}groupInfo`, groupId],
    queryFn: async () => {
      if (!groupId) {
        return;
      }
      const response = await groupsClient.getGroupInfo(Number.parseInt(groupId, 10));
      const groupInfo: TGroupInfo = {
        ownerId: response.owner?.userId,
        groupName: response.name,
      };
      return groupInfo;
    },
  });
};

export const useGetUsersGroupRole = (userId: number, groupId?: string) => {
  return useQuery({
    enabled: !!userId && !!groupId,
    queryKey: [`${ORGANIZATIONS_GROUPS_KEY_PREFIX}userGroupRole`, userId, groupId],
    queryFn: async () => {
      if (!userId || !groupId) {
        return;
      }
      const response = await groupsClient.getUsersGroupRoles(userId);
      const groupMembershipDetails = response.data?.find(
        (membership) => `${membership.group?.id}` === `${groupId}`,
      );
      return groupMembershipDetails;
    },
  });
};
