import adsClient from '@clients/ads';
import { GetAdsMetadataResponseType } from '@type/metadata';

export const getAdsMetadata = async () => {
  const response = await adsClient.get<GetAdsMetadataResponseType>({
    retries: 3, // Retry up to 3 times
    url: '/v1/metadata',
  });
  return response.data;
};
