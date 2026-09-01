import { useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY } from '../../queryKeys';

type UseGetListingShowcaseContentParams = {
  listingId: string;
  enabled?: boolean;
};

const useGetListingShowcaseContent = ({
  listingId,
  enabled = true,
}: UseGetListingShowcaseContentParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY(accountId, listingId),
    queryFn: () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.getListingShowcaseContent(accountId, listingId);
    },
    enabled: enabled && !!accountId && listingId.length > 0,
  });
};

export default useGetListingShowcaseContent;
