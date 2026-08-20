import adsClient from '@clients/ads';
import { GetAdsMetadataResponseType } from '@type/metadata';

export const getAdsMetadata = async (groupId?: number, abortSignal?: AbortSignal) => {
  const groupQuery = groupId == null ? '' : `?groupId=${encodeURIComponent(String(groupId))}`;
  const response = await adsClient.get<GetAdsMetadataResponseType>({
    abortSignal,
    retries: 3, // Retry up to 3 times
    url: `/v1/metadata${groupQuery}`,
  });
  return response.data;
};
