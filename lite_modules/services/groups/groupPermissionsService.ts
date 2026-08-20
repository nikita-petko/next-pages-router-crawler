import groupsClient from '@clients/groups';

interface GroupMembershipResponse {
  permissions: {
    groupEconomyPermissions: {
      spendGroupFunds: boolean;
    };
  };
}

export const getCanSpendGroupFunds = async (
  groupId: number,
  abortSignal?: AbortSignal,
): Promise<boolean> => {
  const response = await groupsClient.get<GroupMembershipResponse>({
    abortSignal,
    url: `groups/${groupId}/membership`,
  });
  return response.data.permissions.groupEconomyPermissions.spendGroupFunds;
};
