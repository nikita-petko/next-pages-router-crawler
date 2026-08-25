import { keepPreviousData, useQuery } from '@tanstack/react-query';
import contentLicensingClient from '@modules/clients/contentLicensing';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { LIST_SHOWCASE_ELIGIBLE_CONTENT_QUERY_KEY } from '../../queryKeys';

type UseListShowcaseEligibleContentByListingParams = {
  listingId: string;
  pageSize?: number;
  pageToken?: string;
  enabled?: boolean;
};

const useListShowcaseEligibleContentByListing = ({
  listingId,
  pageSize,
  pageToken,
  enabled = true,
}: UseListShowcaseEligibleContentByListingParams) => {
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useQuery({
    queryKey: LIST_SHOWCASE_ELIGIBLE_CONTENT_QUERY_KEY(accountId, listingId, pageSize, pageToken),
    queryFn: () => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }

      return contentLicensingClient.listShowcaseEligibleContentByListing(
        accountId,
        listingId,
        pageSize,
        pageToken,
      );
    },
    enabled: enabled && !!accountId && listingId.length > 0,
    placeholderData: keepPreviousData,
  });
};

export default useListShowcaseEligibleContentByListing;
