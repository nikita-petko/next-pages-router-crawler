import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  type GetTicketAsCreatorResponse,
} from '@modules/clients/creatorCommunication';
import { DEFAULT_STALE_TIME_MS } from '../constants/timeConstants';
import { getPlayerSupportTicketDetailQueryKey } from '../queryKeys';

export interface UseTicketDetailQueryOptions {
  enabled?: boolean;
}

const useTicketDetailQuery = (
  ticketId: string | undefined,
  { enabled = true }: UseTicketDetailQueryOptions = {},
): UseQueryResult<GetTicketAsCreatorResponse> =>
  useQuery({
    queryKey: getPlayerSupportTicketDetailQueryKey(ticketId ?? ''),
    queryFn: () =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiCreatorTicketsCreatorTicketIdGet({
        creatorTicketId: ticketId ?? '',
      }),
    enabled: enabled && !!ticketId,
    staleTime: DEFAULT_STALE_TIME_MS,
  });

export default useTicketDetailQuery;
