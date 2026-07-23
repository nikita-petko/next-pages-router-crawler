import { keepPreviousData, useQuery } from '@tanstack/react-query';
import creatorCommunicationApi from '@modules/clients/creatorCommunication';
import { DEFAULT_STALE_TIME_MS } from '../constants/timeConstants';
import getPlayerSupportTicketsQueryKey, {
  type PlayerSupportTicketsQueryKeyParams,
} from '../queryKeys';

interface UsePlayerSupportTicketsQueryParams extends PlayerSupportTicketsQueryKeyParams {
  enabled?: boolean;
  shouldKeepPreviousData?: boolean;
}

const usePlayerSupportTicketsQuery = ({
  universeId,
  status,
  query,
  readFilter,
  category,
  pageToken,
  pageSize,
  enabled = true,
  shouldKeepPreviousData = false,
}: UsePlayerSupportTicketsQueryParams) =>
  useQuery({
    queryKey: getPlayerSupportTicketsQueryKey({
      universeId,
      status,
      query,
      readFilter,
      category,
      pageToken,
      pageSize,
    }),
    queryFn: () =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiUniversesUniverseIdCreatorTicketsSearchGet(
        {
          universeId,
          status,
          query,
          readFilter,
          category,
          pageToken,
          pageSize,
        },
      ),
    enabled: enabled && universeId > 0,
    placeholderData: shouldKeepPreviousData ? keepPreviousData : undefined,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

export default usePlayerSupportTicketsQuery;
