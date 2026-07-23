import adsClient from '@clients/ads';
import { UpdatedAdStatus } from '@type/campaign';

export const updateAdStatus = async (adId: string, status: UpdatedAdStatus) => {
  // Response from AMA for update ad is empty
  const response = await adsClient.patch<Record<string, never>>({
    body: { ad: { status } },
    url: `/v1/ads/${adId}`,
  });

  return response.data;
};
