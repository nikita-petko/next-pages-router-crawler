import { useQuery } from '@tanstack/react-query';
import type {
  ItemConfigurationClient,
  ItemConfigurationCollectiblesMetadataResponse,
} from '@modules/clients/itemconfiguration';

const defaultMetadataResponse: ItemConfigurationCollectiblesMetadataResponse = {};

export default function useGetMetadata(itemConfigurationClient: ItemConfigurationClient) {
  return useQuery({
    queryKey: ['metadata'],
    queryFn: async () => {
      try {
        const metadataResponse = await itemConfigurationClient.getCollectiblePublishingMetadata();
        return metadataResponse ?? defaultMetadataResponse;
      } catch {
        return defaultMetadataResponse;
      }
    },
  });
}
