import { captureException } from '@sentry/nextjs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ListingsReplaceListingShowcaseContentRequest } from '@rbx/client-content-licensing-api/v1';
import contentLicensingClient, {
  type ListingShowcaseContentWithETag,
} from '@modules/clients/contentLicensing';
import { getResponseFromError } from '@modules/clients/utils';
import { useCurrentAccountContext } from '../../../components/AccountProvider';
import { GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY } from '../../queryKeys';
import {
  isExpectedShowcaseSaveError,
  parseShowcaseSaveError,
} from '../utils/parseShowcaseSaveError';

type ReplaceListingShowcaseContentParams = {
  request: ListingsReplaceListingShowcaseContentRequest;
  ifMatch: string;
};

export type ShowcaseConflictRecovery = {
  latestContent: ListingShowcaseContentWithETag | undefined;
  refreshSucceeded: boolean;
};

type UseReplaceListingShowcaseContentMutationParams = {
  listingId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void | Promise<void>;
  onConflict?: (recovery: ShowcaseConflictRecovery) => void;
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
      const parsedError = await parseShowcaseSaveError(error);
      if (!isExpectedShowcaseSaveError(parsedError)) {
        captureException(error, {
          tags: { module: 'license-manager', operation: 'replaceListingShowcaseContent' },
          extra: { accountId, listingId },
        });
      }
      if (getResponseFromError(error)?.status === 409) {
        const queryKey = GET_LISTING_SHOWCASE_CONTENT_QUERY_KEY(accountId, listingId);
        try {
          await queryClient.refetchQueries(
            {
              queryKey,
            },
            { throwOnError: true },
          );
          onConflict?.({
            latestContent: queryClient.getQueryData<ListingShowcaseContentWithETag>(queryKey),
            refreshSucceeded: true,
          });
        } catch {
          onConflict?.({
            latestContent: undefined,
            refreshSucceeded: false,
          });
        }
      }
      await onError?.(error);
    },
  });
};

export default useReplaceListingShowcaseContentMutation;
