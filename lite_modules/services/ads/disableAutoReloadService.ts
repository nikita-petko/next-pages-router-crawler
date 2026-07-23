import adsClient from '@clients/ads';

export const disableAutoReload = async (groupId?: number) => {
  const url = groupId
    ? `/v3/native/campaigns/disableAutoReload?groupId=${groupId}`
    : '/v3/native/campaigns/disableAutoReload';

  const response = await adsClient.post<Record<string, never>>({
    body: {},
    url,
  });

  return response.data;
};
