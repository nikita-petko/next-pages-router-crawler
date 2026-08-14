import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ListingsReplaceListingShowcaseContentRequest } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient, {
  type ListingShowcaseContentWithETag,
} from '@modules/clients/contentLicensing';
import { getResponseFromError } from '@modules/clients/utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY } from '../../queryKeys';

type ReplaceListingShowcaseContentParams = {
  request: ListingsReplaceListingShowcaseContentRequest;
  ifMatch: string;
};

type UseReplaceListingShowcaseContentMutationParams = {
  listingId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onConflict?: (latestContent: ListingShowcaseContentWithETag | undefined) => void;
};

const useReplaceListingShowcaseContentMutation = ({
  listingId,
  onSuccess,
  onError,
  onConflict,
}: UseReplaceListingShowcaseContentMutationParams) => {
  const queryClient = useQueryClient();
  const { account } = useCurrentAccountContext();
  const accountId = account?.id;

  return useMutation({
    mutationFn: ({ request, ifMatch }: ReplaceListingShowcaseContentParams) => {
      if (!accountId) {
        throw new Error('Missing account ID');
      }
      if (!listingId) {
        throw new Error('Missing IP listing ID');
      }

      return contentLicensingClient.replaceListingShowcaseContent(
        accountId,
        listingId,
        request,
        ifMatch,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY(accountId, listingId),
      });
      onSuccess?.();
    },
    onError: async (error) => {
      captureException(error, {
        tags: { module: 'license-manager', operation: 'replaceListingShowcaseContent' },
        extra: { accountId, listingId },
      });
      if (getResponseFromError(error)?.status === 409) {
        const queryKey = GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY(accountId, listingId);
        await queryClient.refetchQueries({
          queryKey,
        });
        onConflict?.(queryClient.getQueryData<ListingShowcaseContentWithETag>(queryKey));
      }
      onError?.(error);
    },
  });
};

export default useReplaceListingShowcaseContentMutation;
