import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';

type UseGetPublicListingShowcaseContentParams = {
  listingId: string;
  enabled: boolean;
};

export const getPublicListingShowcaseContentKey =
  'contentLicensingApiClient/getPublicListingShowcaseContent';

const useGetPublicListingShowcaseContent = ({
  listingId,
  enabled,
}: UseGetPublicListingShowcaseContentParams) => {
  const normalizedListingId = listingId.trim();
  return useQuery({
    queryKey: [getPublicListingShowcaseContentKey, normalizedListingId],
    queryFn: () => contentLicensingClient.getPublicListingShowcaseContent(normalizedListingId),
    enabled: enabled && normalizedListingId.length > 0,
  });
};

export default useGetPublicListingShowcaseContent;
