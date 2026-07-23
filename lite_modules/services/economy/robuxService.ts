import economyClient from '@clients/economy';
import { GetRobuxBalanceResponse } from '@type/payment';

export const getRobuxBalance = async () => {
  const response = await economyClient.get<GetRobuxBalanceResponse>({
    url: 'user/currency',
  });
  return response.data;
};

export const getGroupRobuxBalance = async (groupId: number) => {
  const response = await economyClient.get<GetRobuxBalanceResponse>({
    url: `groups/${groupId}/currency`,
  });
  return response.data;
};
