import { useQuery } from '@tanstack/react-query';
import type { ClaimItemViewResponse } from '@rbx/client-rights/v1';
import { ClaimItemViewViewStatusEnum } from '@rbx/client-rights/v1';
import rightsClient from '@modules/clients/rights';

export const claimItemViewKey = 'rightsClient/claimItemView';

const POLLING_INTERVAL_MS = 500;

// 403 means forbidden (i.e. either the content has been moderated or the claim item is in terminal state)
export const is403Error = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'status' in error) {
    const { status } = error as { status: number };
    return status === 403;
  }
  if (error && typeof error === 'object' && 'response' in error) {
    const { response } = error as { response?: { status?: number } };
    return response?.status === 403;
  }
  return false;
};

export const useClaimItemView = (
  accountId: string,
  claimItemId: string,
  enabled: boolean = true,
) => {
  const response = useQuery<ClaimItemViewResponse>({
    queryKey: [claimItemViewKey, accountId, claimItemId],
    queryFn: async () => {
      return rightsClient.getClaimItemView(accountId ?? '', claimItemId);
    },
    enabled: enabled && !!accountId && !!claimItemId,
    refetchInterval: ({ state }) => {
      const { data, error } = state;

      if (error && is403Error(error)) {
        return false;
      }

      if (!data?.contentViews) {
        return POLLING_INTERVAL_MS;
      }

      const viewsReady = data.contentViews.every(
        (view) =>
          view.viewStatus === ClaimItemViewViewStatusEnum.Ready ||
          view.viewStatus === ClaimItemViewViewStatusEnum.Error,
      );

      return viewsReady ? false : POLLING_INTERVAL_MS;
    },
    retry: (failureCount, error) => {
      if (is403Error(error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    claimItemView: response.data,
    ...response,
  };
};
export default useClaimItemView;
