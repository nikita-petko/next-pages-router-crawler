import { useQuery } from '@tanstack/react-query';
import { rightsClient } from '@modules/clients';

export const isContentUnderReviewKey = 'rightsClient/isContentUnderReview';

export const useIsContentUnderReview = (
  ownerContentId: string,
  pageSize: number,
  pageToken: string,
) => {
  const response = useQuery({
    queryKey: [isContentUnderReviewKey, ownerContentId, pageSize, pageToken],
    queryFn: async () => {
      return rightsClient.isContentUnderReview(ownerContentId ?? '', pageSize, pageToken);
    },
  });

  return response;
};
export default useIsContentUnderReview;
