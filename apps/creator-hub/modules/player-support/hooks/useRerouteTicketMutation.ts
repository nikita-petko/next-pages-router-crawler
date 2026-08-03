import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import creatorCommunicationApi, {
  type RerouteCreatorTicketToRobloxCSResponse,
} from '@modules/clients/creatorCommunication';
import { getPlayerSupportTicketDetailQueryKey } from '../queryKeys';
import useIdempotencyKey, { idempotentRetryConfig } from './useIdempotencyKey';

export interface UseRerouteTicketMutationParams {
  universeId: number;
  ticketId: string;
  onSuccess?: (response: RerouteCreatorTicketToRobloxCSResponse) => void;
  onError?: (error: unknown) => void;
}

/**
 * Reroutes ("forwards") a creator ticket to Roblox Customer Support via
 * `RerouteCreatorTicketToRobloxCS`. Mirrors `useReportTicketMutation`: the
 * request is idempotent (stable key across retries) and, on success, both the
 * ticket lists and this ticket's detail cache are invalidated so the UI
 * reflects the ticket leaving the creator's inbox.
 */
const useRerouteTicketMutation = ({
  universeId,
  ticketId,
  onSuccess,
  onError,
}: UseRerouteTicketMutationParams): UseMutationResult<
  RerouteCreatorTicketToRobloxCSResponse,
  unknown,
  void
> => {
  const queryClient = useQueryClient();
  const idempotencyKey = useIdempotencyKey('reroute');

  return useMutation({
    ...idempotentRetryConfig,
    mutationFn: () =>
      creatorCommunicationApi.v1beta1CreatorCommunicationApiCreatorTicketsCreatorTicketIdReroutePost(
        {
          creatorTicketId: ticketId,
          rerouteCreatorTicketToRobloxCSRequest: {
            creatorTicketId: ticketId,
            universeId,
            idempotencyKey: idempotencyKey.ensure(),
          },
        },
      ),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: ['playerSupportTickets'] });
      void queryClient.invalidateQueries({
        queryKey: getPlayerSupportTicketDetailQueryKey(ticketId),
      });
      onSuccess?.(response);
    },
    onError,
    onSettled: idempotencyKey.reset,
  });
};

export default useRerouteTicketMutation;
