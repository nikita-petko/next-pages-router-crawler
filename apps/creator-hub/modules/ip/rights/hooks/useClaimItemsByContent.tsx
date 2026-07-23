import { rightsClient } from '@modules/clients';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const claimItemsKey = 'rightsClient/claimItemByContent';

export default function useClaimItemsByContent(
  accountId?: string,
  contentType?: string,
  contentId?: string,
) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [claimItemsKey, contentId] });
  };
  const response = useQuery({
    queryKey: [claimItemsKey, contentId],
    queryFn: async () => {
      return rightsClient.listClaimItemsByContent(
        accountId ?? '',
        contentType ?? '',
        contentId ?? '',
      );
    },
    enabled: !!accountId && !!contentType && !!contentId,
  });

  const claimItems = response.data?.claimItems || [];
  return { claimItems, ...response, invalidate };
}
