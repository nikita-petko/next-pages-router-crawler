import adsClient from '@clients/ads';
import { UpdatedCampaignStatus } from '@type/campaign';

export const updateCampaignStatus = async (campaignId: string, status: UpdatedCampaignStatus) => {
  // Response from AMA for update campaign is empty
  const response = await adsClient.patch<Record<string, never>>({
    body: { campaign: { status } },
    url: `/v3/native/campaigns/${campaignId}`,
  });

  return response.data;
};
