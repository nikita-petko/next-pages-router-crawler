import adsClient from '@clients/ads';
import { FiltersOnEntity, ListFilteredIdsResponseType } from '@type/filter';

export const getFilteredCampaignIds = async (
  campaignFilter: FiltersOnEntity,
): Promise<string[]> => {
  const response = await adsClient.post<ListFilteredIdsResponseType>({
    body: { campaign_filter: campaignFilter },
    url: '/v1/filter',
  });
  return response.data.ids;
};
