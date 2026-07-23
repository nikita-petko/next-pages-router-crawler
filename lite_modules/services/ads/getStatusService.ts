import adsClient from '@clients/ads';
import {
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
  GetUpdatedStatusesResponseType,
} from '@type/campaign';

export const getCampaignStatus = async (campaignIds: string[]) => {
  const response = await adsClient.post<GetCampaignStatusResponseType[]>({
    body: { campaign_ids: campaignIds },
    url: '/v3/native/campaigns/status',
  });

  return response.data;
};

export const getUpdatedStatuses = async (campaignId: string) => {
  const response = await adsClient.get<GetUpdatedStatusesResponseType>({
    url: `/v3/native/campaigns/updatedStatus/${campaignId}`,
  });

  return response.data;
};

export const getAdStatus = async (adIds: string[]) => {
  const response = await adsClient.post<GetAdStatusResponseType[]>({
    body: { ad_ids: adIds },
    url: '/v1/ads/status',
  });

  return response.data;
};
