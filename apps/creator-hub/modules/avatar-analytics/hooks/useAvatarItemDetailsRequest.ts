import { AvatarItemDetail, AvatarItemDetailsRequest } from '@modules/clients/analytics';
import { NonPaginatedRequest, usePaginatedRequest } from '@modules/experience-analytics-shared';
import { useMemo } from 'react';
import { AvatarItemsApiClient } from '../context/AvatarAnalyticsClientProvider';

const useAvatarItemDetailsRequest = (
  request: NonPaginatedRequest<AvatarItemDetailsRequest> | undefined,
  client: AvatarItemsApiClient,
  initPageSize = 10,
) => {
  const makeApiRequest = useMemo(
    () => async (detailRequest: AvatarItemDetailsRequest) => {
      return client.getAvatarItemDetails(detailRequest);
    },
    [client],
  );

  return usePaginatedRequest<AvatarItemDetailsRequest, AvatarItemDetail>(
    request,
    makeApiRequest,
    initPageSize,
  );
};

export default useAvatarItemDetailsRequest;
