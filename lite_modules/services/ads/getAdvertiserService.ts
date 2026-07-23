import adsClient from '@clients/ads';
import { AdvertiserType } from '@type/advertiser';

export const getAdvertiser = async (groupId?: number) => {
  const url = groupId ? `/v1/advertiser?groupId=${groupId}` : '/v1/advertiser';
  const response = await adsClient.get<AdvertiserType>({
    url,
  });
  return response.data;
};
